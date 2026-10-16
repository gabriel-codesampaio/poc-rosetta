import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from './src/chat/useChat';
import { Primitive } from './src/components/Primitive';
import { API_URL } from './src/config';
import { colors } from './src/theme';

const SESSION_ID = `mobile-${Math.random().toString(36).slice(2, 10)}`;

function Chat() {
  const { entries, loading, send, act } = useChat({ apiUrl: API_URL, channel: 'mobile', sessionId: SESSION_ID });
  const [text, setText] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);

  const submit = () => {
    send(text);
    setText('');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Assistente de Pontos</Text>
        <Text style={styles.subtitle}>canal mobile · {API_URL}</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {entries.map((e) =>
            e.from === 'bot' ? (
              <View key={e.id} style={styles.group}>
                {e.components.map((c, i) => <Primitive key={i} component={c} onAction={act} />)}
              </View>
            ) : e.from === 'user' ? (
              <View key={e.id} style={styles.user}>
                <Text style={styles.userText}>{e.text}</Text>
              </View>
            ) : (
              <Text key={e.id} style={styles.error}>{e.text}</Text>
            ),
          )}
          {loading && <Text style={styles.typing}>digitando…</Text>}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Escreva (ex.: saldo, ofertas)"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="send"
          />
          <Pressable onPress={submit} disabled={!text.trim()} style={[styles.send, !text.trim() && styles.disabled]}>
            <Text style={styles.sendText}>Enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Chat />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.panel },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  thread: { padding: 16, gap: 10 },
  group: { gap: 8, alignItems: 'flex-start' },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.brand,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  userText: { color: '#fff', fontSize: 15 },
  error: { alignSelf: 'center', color: colors.error, fontSize: 13, textAlign: 'center' },
  typing: { color: colors.muted, fontStyle: 'italic' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  send: { backgroundColor: colors.brand, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '600' },
});
