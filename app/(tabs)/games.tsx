import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type TicTacToeBoard = (null | "X" | "O")[];

function checkWinner(board: TicTacToeBoard): "X" | "O" | "draw" | null {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as "X" | "O";
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

function TicTacToeGame({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const [board, setBoard] = useState<TicTacToeBoard>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const winner = checkWinner(board);

  const handlePress = (i: number) => {
    if (board[i] || winner) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...board];
    next[i] = isX ? "X" : "O";
    setBoard(next);
    setIsX(!isX);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsX(true);
  };

  const statusText = winner
    ? winner === "draw" ? "تعادل! 🤝" : `الفائز: ${winner} 🎉`
    : `دور اللاعب ${isX ? "X" : "O"}`;

  return (
    <View style={[styles.gameContainer, { backgroundColor: colors.background }]}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.gameTitle, { color: colors.text }]}>إكس أو</Text>
        <TouchableOpacity onPress={reset}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.statusText, { color: colors.primary }]}>{statusText}</Text>

      <View style={[styles.grid, { borderColor: colors.border }]}>
        {board.map((cell, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.cell,
              { borderColor: colors.border },
              { borderRightWidth: (i % 3 === 2) ? 0 : 1 },
              { borderBottomWidth: i >= 6 ? 0 : 1 },
            ]}
            onPress={() => handlePress(i)}
          >
            <Text style={[styles.cellText, { color: cell === "X" ? colors.primary : colors.gold }]}>
              {cell ?? ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {winner && (
        <TouchableOpacity style={[styles.playAgainBtn, { backgroundColor: colors.primary }]} onPress={reset}>
          <Text style={styles.playAgainText}>العب مجدداً</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function NumberGame({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const [target] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guesses, setGuesses] = useState<number[]>([]);
  const [current, setCurrent] = useState("");
  const [won, setWon] = useState(false);

  const guess = () => {
    const n = parseInt(current);
    if (isNaN(n) || n < 1 || n > 100) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGuesses((prev) => [...prev, n]);
    if (n === target) {
      setWon(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCurrent("");
  };

  const lastGuess = guesses[guesses.length - 1];
  const hint = !won && lastGuess !== undefined
    ? lastGuess < target ? "أكبر ⬆️" : "أصغر ⬇️"
    : "";

  return (
    <View style={[styles.gameContainer, { backgroundColor: colors.background }]}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.gameTitle, { color: colors.text }]}>خمّن الرقم</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.statusText, { color: colors.mutedForeground }]}>خمّن رقماً من 1 إلى 100</Text>
      <Text style={[styles.attemptsText, { color: colors.primary }]}>المحاولات: {guesses.length}</Text>

      {hint ? <Text style={[styles.hintText, { color: colors.gold }]}>{hint}</Text> : null}

      {won ? (
        <View style={styles.wonBox}>
          <Text style={[styles.wonText, { color: colors.primary }]}>🎉 أحسنت! الرقم كان {target}</Text>
          <Text style={[styles.wonSubText, { color: colors.mutedForeground }]}>في {guesses.length} محاولة</Text>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <View style={styles.numPad}>
            {[1,2,3,4,5,6,7,8,9,0].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.numBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setCurrent((c) => c.length < 3 ? c + n : c)}
              >
                <Text style={[styles.numBtnText, { color: colors.text }]}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.numBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setCurrent((c) => c.slice(0, -1))}
            >
              <Ionicons name="backspace" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.guessDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guessNum, { color: colors.primary }]}>{current || "?"}</Text>
          </View>
          <TouchableOpacity
            style={[styles.guessBtn, { backgroundColor: colors.primary }]}
            onPress={guess}
          >
            <Text style={styles.guessBtnText}>تخمين</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  players: string;
  color: string;
}

const GAMES: Game[] = [
  { id: "ttt", title: "إكس أو", description: "العب ضد صديقك", icon: "grid", players: "2 لاعبين", color: "#8B5CF6" },
  { id: "num", title: "خمّن الرقم", description: "خمّن الرقم السري", icon: "help-circle", players: "لاعب واحد", color: "#F59E0B" },
  { id: "quiz", title: "مسابقة معلومات", description: "اختبر معلوماتك", icon: "bulb", players: "لاعب واحد", color: "#10B981" },
  { id: "word", title: "لعبة الكلمات", description: "شكّل الكلمات", icon: "text", players: "2 لاعبين", color: "#EC4899" },
];

export default function GamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>الألعاب</Text>
      </View>

      <Modal visible={!!activeGame} animationType="slide" presentationStyle="pageSheet">
        {activeGame === "ttt" && <TicTacToeGame onClose={() => setActiveGame(null)} />}
        {activeGame === "num" && <NumberGame onClose={() => setActiveGame(null)} />}
      </Modal>

      <FlatList
        data={GAMES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (item.id === "quiz" || item.id === "word") {
                Alert.alert("قريباً", "هذه اللعبة ستكون متاحة قريباً!");
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveGame(item.id);
              }
            }}
          >
            <View style={[styles.gameIcon, { backgroundColor: item.color + "22" }]}>
              <Ionicons name={item.icon as never} size={32} color={item.color} />
            </View>
            <Text style={[styles.gameName, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.gameDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
            <View style={[styles.playersBadge, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="people" size={12} color={colors.primary} />
              <Text style={[styles.playersText, { color: colors.primary }]}>{item.players}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: isWeb ? 34 : 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: "800" },
  row: { gap: 12, marginBottom: 0 },
  gameCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  gameIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gameName: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  gameDesc: { fontSize: 12, textAlign: "center" },
  playersBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  playersText: { fontSize: 11, fontWeight: "600" },
  gameContainer: { flex: 1, padding: 20, alignItems: "center" },
  gameHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 20 },
  gameTitle: { fontSize: 22, fontWeight: "800" },
  statusText: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  grid: { width: 270, height: 270, flexDirection: "row", flexWrap: "wrap" },
  cell: { width: 90, height: 90, alignItems: "center", justifyContent: "center" },
  cellText: { fontSize: 40, fontWeight: "900" },
  playAgainBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14 },
  playAgainText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  attemptsText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  hintText: { fontSize: 24, fontWeight: "800", marginVertical: 12 },
  wonBox: { alignItems: "center", gap: 8, marginTop: 20 },
  wonText: { fontSize: 22, fontWeight: "800" },
  wonSubText: { fontSize: 16 },
  inputRow: { width: "100%", alignItems: "center", gap: 16, marginTop: 10 },
  numPad: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: 200, justifyContent: "center" },
  numBtn: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numBtnText: { fontSize: 22, fontWeight: "700" },
  guessDisplay: { width: 120, height: 60, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  guessNum: { fontSize: 32, fontWeight: "900" },
  guessBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  guessBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
