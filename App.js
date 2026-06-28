import React, { Component } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';

// ─────────────────────────────────────────────
// CLASS 1: EventLogger
// Stores and manages all interaction event logs
// ─────────────────────────────────────────────
class EventLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
  }

  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp,
    };
    this.logs = [entry, ...this.logs].slice(0, this.maxLogs);
    return entry;
  }

  clear() {
    this.logs = [];
  }

  getLogs() {
    return this.logs;
  }
}

// ─────────────────────────────────────────────
// CLASS 2: KeyboardHandler
// Processes all keyboard and text input events
// ─────────────────────────────────────────────
class KeyboardHandler {
  constructor(logger) {
    this.logger = logger;
    this.lastKey = null;
  }

  handleTextChange(text, previousText) {
    if (text.length > previousText.length) {
      const newChar = text[text.length - 1];
      this.lastKey = newChar;

      if (newChar === ' ') {
        return this.logger.log('keyboard', 'Space key pressed');
      } else if (newChar === '\n') {
        return this.logger.log('keyboard', 'Enter / Return key pressed');
      } else {
        return this.logger.log('keyboard', `Key pressed: "${newChar}"`);
      }
    } else if (text.length < previousText.length) {
      return this.logger.log('keyboard', 'Backspace / Delete pressed');
    }
    return null;
  }

  handleSubmit(text) {
    if (text.trim().length === 0) {
      return this.logger.log('keyboard', 'Submit attempted with empty input');
    }
    return this.logger.log('keyboard', `Input submitted: "${text.trim()}"`);
  }

  handleFocus() {
    return this.logger.log('keyboard', 'Keyboard focused');
  }

  handleBlur() {
    return this.logger.log('keyboard', 'Keyboard dismissed');
  }
}

// ─────────────────────────────────────────────
// CLASS 3: GestureHandler
// Detects and classifies touch gestures
// ─────────────────────────────────────────────
class GestureHandler {
  constructor(logger) {
    this.logger = logger;
    this.tapCount = 0;
    this.tapTimer = null;
    this.gestureStart = null;
  }

  onTouchStart(x, y) {
    this.gestureStart = { x, y, time: Date.now() };
    return this.logger.log('gesture', `Touch started at (${Math.round(x)}, ${Math.round(y)})`);
  }

  onTouchEnd(x, y) {
    if (!this.gestureStart) return null;

    const dx = x - this.gestureStart.x;
    const dy = y - this.gestureStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - this.gestureStart.time;

    let result;

    if (distance < 10 && duration < 300) {
      this.tapCount++;
      clearTimeout(this.tapTimer);
      this.tapTimer = setTimeout(() => {
        if (this.tapCount === 2) {
          this.logger.log('gesture', 'Double Tap detected');
        }
        this.tapCount = 0;
      }, 300);
      result = this.logger.log('gesture', 'Single Tap detected');
    } else if (distance < 10 && duration >= 300) {
      result = this.logger.log('gesture', `Long Press detected (${duration}ms)`);
    } else {
      result = this._classifySwipe(dx, dy, distance);
    }

    this.gestureStart = null;
    return result;
  }

  _classifySwipe(dx, dy, distance) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      return dx > 0
        ? this.logger.log('gesture', `Swipe RIGHT (${Math.round(distance)}px)`)
        : this.logger.log('gesture', `Swipe LEFT (${Math.round(distance)}px)`);
    } else {
      return dy > 0
        ? this.logger.log('gesture', `Swipe DOWN (${Math.round(distance)}px)`)
        : this.logger.log('gesture', `Swipe UP (${Math.round(distance)}px)`);
    }
  }

  onTouchMove() {
    return null;
  }
}

// ─────────────────────────────────────────────
// CLASS 4: MessageDisplay
// Manages temporary notification messages
// ─────────────────────────────────────────────
class MessageDisplay {
  constructor() {
    this.messages = [];
  }

  show(text, type = 'info') {
    const msg = {
      id: Date.now(),
      text,
      type,
    };
    this.messages = [msg, ...this.messages].slice(0, 3);
    return msg;
  }

  dismiss(id) {
    this.messages = this.messages.filter(m => m.id !== id);
  }

  getMessages() {
    return this.messages;
  }
}

// ─────────────────────────────────────────────
// CLASS 5: App — Main class-based React Component
// Orchestrates all four handler classes
// ─────────────────────────────────────────────
class App extends Component {
  constructor(props) {
    super(props);

    this.eventLogger     = new EventLogger();
    this.keyboardHandler = new KeyboardHandler(this.eventLogger);
    this.gestureHandler  = new GestureHandler(this.eventLogger);
    this.messageDisplay  = new MessageDisplay();

    this.state = {
      inputText: '',
      logs: [],
      toastMessage: null,
      activeTab: 'gesture',
      submittedText: '',
      fadeAnim: new Animated.Value(0),
    };

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const entry = this.gestureHandler.onTouchStart(locationX, locationY);
        this._syncState(entry, null);
      },

      onPanResponderRelease: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const entry = this.gestureHandler.onTouchEnd(locationX, locationY);
        if (entry) {
          const toast = this.messageDisplay.show(entry.message, 'gesture');
          this._syncState(entry, toast);
        }
      },
    });
  }

  _syncState(logEntry, toast) {
    this.setState({
      logs: this.eventLogger.getLogs(),
      toastMessage: toast ? toast.text : this.state.toastMessage,
    });
    if (toast) this._showToastAnimation();
  }

  _showToastAnimation() {
    Animated.sequence([
      Animated.timing(this.state.fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(this.state.fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => this.setState({ toastMessage: null }));
  }

  _onChangeText = (text) => {
    const entry = this.keyboardHandler.handleTextChange(text, this.state.inputText);
    this.setState({ inputText: text });
    if (entry) this._syncState(entry, null);
  };

  _onSubmit = () => {
    if (this.state.inputText.trim().length === 0) {
      const entry = this.keyboardHandler.handleSubmit('');
      this._syncState(entry, null);
      return;
    }
    const entry = this.keyboardHandler.handleSubmit(this.state.inputText);
    const toast = this.messageDisplay.show(`Submitted: "${this.state.inputText.trim()}"`, 'success');
    this.setState({ submittedText: this.state.inputText, inputText: '' });
    this._syncState(entry, toast);
  };

  _onFocus = () => {
    const entry = this.keyboardHandler.handleFocus();
    this._syncState(entry, null);
  };

  _onBlur = () => {
    const entry = this.keyboardHandler.handleBlur();
    this._syncState(entry, null);
  };

  _clearLogs = () => {
    this.eventLogger.clear();
    this.setState({ logs: [] });
  };

  _renderLogEntry(item) {
    const colors = {
      keyboard: '#3B82F6',
      gesture:  '#8B5CF6',
      system:   '#10B981',
    };
    return (
      <View key={item.id} style={styles.logEntry}>
        <View style={[styles.logDot, { backgroundColor: colors[item.type] || '#888' }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.logMsg}>{item.message}</Text>
          <Text style={styles.logTime}>{item.timestamp}</Text>
        </View>
      </View>
    );
  }

  _renderTab(label, key) {
    const active = this.state.activeTab === key;
    return (
      <TouchableOpacity
        key={key}
        style={[styles.tab, active && styles.tabActive]}
        onPress={() => this.setState({ activeTab: key })}
      >
        <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  render() {
    const { inputText, logs, toastMessage, activeTab, submittedText, fadeAnim } = this.state;
    const keyboardLogs = logs.filter(l => l.type === 'keyboard');
    const gestureLogs  = logs.filter(l => l.type === 'gesture');

    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>InteractionApp</Text>
          <Text style={styles.headerSub}>OOP Class-Based  |  Keyboard + Gestures</Text>
        </View>

        {/* Toast notification */}
        {toastMessage && (
          <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* Gesture detection pad */}
        <View style={styles.gesturePad} {...this._panResponder.panHandlers}>
          <Text style={styles.gesturePadTitle}>Touch / Gesture Zone</Text>
          <Text style={styles.gesturePadHint}>Tap  |  Double-Tap  |  Long Press  |  Swipe</Text>
          {gestureLogs.length > 0 && (
            <Text style={styles.gestureLast}>{gestureLogs[0].message}</Text>
          )}
        </View>

        {/* Keyboard input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Type here to log keyboard events..."
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={this._onChangeText}
            onFocus={this._onFocus}
            onBlur={this._onBlur}
            returnKeyType="send"
            onSubmitEditing={this._onSubmit}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={this._onSubmit}>
            <Text style={styles.submitBtnText}>Send</Text>
          </TouchableOpacity>
        </View>

        {submittedText !== '' && (
          <Text style={styles.submitted}>Last submitted: "{submittedText}"</Text>
        )}

        {/* Filter tabs */}
        <View style={styles.tabs}>
          {this._renderTab(`Keyboard (${keyboardLogs.length})`, 'keyboard')}
          {this._renderTab(`Gestures (${gestureLogs.length})`, 'gesture')}
          {this._renderTab(`All (${logs.length})`, 'all')}
        </View>

        {/* Event log list */}
        <View style={styles.logContainer}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Event Log</Text>
            <TouchableOpacity onPress={this._clearLogs}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {(activeTab === 'keyboard' ? keyboardLogs
              : activeTab === 'gesture' ? gestureLogs
              : logs
            ).map(item => this._renderLogEntry(item))}
            {logs.length === 0 && (
              <Text style={styles.emptyLog}>No events yet. Touch the pad or start typing.</Text>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 999,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  gesturePad: {
    margin: 16,
    height: 160,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gesturePadTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '700',
  },
  gesturePadHint: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
  gestureLast: {
    color: '#8B5CF6',
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
  inputSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F1F5F9',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitted: {
    color: '#10B981',
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#334155',
  },
  tabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F1F5F9',
  },
  logContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  logTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  logScroll: {
    flex: 1,
    padding: 10,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  logMsg: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  logTime: {
    color: '#475569',
    fontSize: 10,
    marginTop: 2,
  },
  emptyLog: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default App;