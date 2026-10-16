import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatPoints, parseMarkdown } from '../chat/markdown';
import type { Action, Card, Component } from '../contract';
import { colors } from '../theme';

type OnAction = (action: Action) => void;

export function Markdown({ content, style }: { content: string; style?: object }) {
  return (
    <Text style={[styles.text, style]}>
      {parseMarkdown(content).map((line, i, all) => (
        <Text key={i}>
          {line.map((s, j) => (
            <Text
              key={j}
              style={[s.bold && styles.bold, s.italic && styles.italic, s.href && styles.link]}
              onPress={s.href ? () => Linking.openURL(s.href!) : undefined}
            >
              {s.text}
            </Text>
          ))}
          {i < all.length - 1 ? '\n' : ''}
        </Text>
      ))}
    </Text>
  );
}

function ActionButtons({ actions, onAction }: { actions: Action[]; onAction: OnAction }) {
  return (
    <View style={styles.actions}>
      {actions.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => onAction(a)}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CardView({ card, onAction }: { card: Card; onAction: OnAction }) {
  return (
    <View style={styles.card}>
      {card.image && <Image source={{ uri: card.image }} style={styles.cardImage} />}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {card.subtitle && <Text style={styles.muted}>{card.subtitle}</Text>}
        {card.points != null && <Text style={styles.points}>{formatPoints(card.points)}</Text>}
        {card.actions?.length ? <ActionButtons actions={card.actions} onAction={onAction} /> : null}
      </View>
    </View>
  );
}

/** Desenha um primitivo do contrato com componentes nativos. */
export function Primitive({ component: c, onAction }: { component: Component; onAction: OnAction }) {
  switch (c.type) {
    case 'text':
      return <View style={styles.bubble}><Markdown content={c.content} /></View>;
    case 'image':
      return (
        <View style={[styles.bubble, styles.imageBubble]}>
          <Image source={{ uri: c.url }} style={styles.image} accessibilityLabel={c.caption} />
          {c.caption && <Markdown content={c.caption} style={styles.caption} />}
        </View>
      );
    case 'buttons':
      return (
        <View style={styles.bubble}>
          {c.text && <Markdown content={c.text} />}
          <ActionButtons actions={c.actions} onAction={onAction} />
        </View>
      );
    case 'card':
      return <CardView card={c} onAction={onAction} />;
    case 'carousel':
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {c.cards.map((card, i) => <CardView key={i} card={card} onAction={onAction} />)}
        </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    backgroundColor: colors.bubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  text: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { color: colors.brand, textDecorationLine: 'underline' },
  muted: { color: colors.muted, fontSize: 13 },
  imageBubble: { padding: 6 },
  image: { width: 260, aspectRatio: 16 / 10, borderRadius: 12 },
  caption: { fontSize: 13.5, paddingHorizontal: 6, paddingTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  action: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.panel,
  },
  actionPressed: { backgroundColor: colors.brandSoft },
  actionText: { color: colors.brand, fontSize: 14, fontWeight: '500' },
  carousel: { gap: 10, paddingRight: 16 },
  card: {
    width: 230,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.panel,
  },
  cardImage: { width: '100%', aspectRatio: 16 / 10 },
  cardBody: { padding: 12, gap: 2 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  points: { color: colors.brand, fontWeight: '600', marginTop: 4 },
});
