import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface Story {
  id: string;
  authorName: string;
  authorPhotoURL: string | null;
  mediaURL?: string;
  mediaType?: string;
  imageURL?: string;
  createdAt: any;
}

interface Props {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          if (index < stories.length - 1) {
            setIndex(i => i + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [index]);

  const story = stories[index];
  if (!story) return null;

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        {/* Progress bars */}
        <View style={styles.progressRow}>
          {stories.map((_, i) => (
            <View key={i} style={[styles.progressBg, { flex: 1 }]}>
              <View style={[styles.progressFill, {
                width: i < index ? "100%" : i === index ? `${progress}%` : "0%"
              }]} />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.authorName}>{story.authorName}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content */}
        {story.mediaURL || story.imageURL ? (
          <Image source={{ uri: story.mediaURL || story.imageURL }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>{story.authorName}</Text>
          </View>
        )}

        {/* Tap areas */}
        <View style={styles.tapAreas}>
          <TouchableOpacity style={styles.tapLeft} onPress={() => {
            if (index > 0) setIndex(index - 1);
          }} />
          <TouchableOpacity style={styles.tapRight} onPress={() => {
            if (index < stories.length - 1) setIndex(index + 1);
            else onClose();
          }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  progressRow: { flexDirection: "row", gap: 4, position: "absolute", top: 50, left: 12, right: 12, zIndex: 10 },
  progressBg: { height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: "#fff", borderRadius: 2 },
  header: { position: "absolute", top: 60, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10 },
  authorName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  image: { width, height },
  noImage: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#222" },
  noImageText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  tapAreas: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
