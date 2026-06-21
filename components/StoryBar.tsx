import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Avatar from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  seen: boolean;
  createdAt: any;
  mediaURL?: string;
  mediaType?: string;
}

interface Props {
  stories: Story[];
  currentUserId: string | undefined;
  onAddStory: () => void;
  onViewStory: (story: Story) => void;
}

export default function StoryBar({ stories, currentUserId, onAddStory, onViewStory }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity style={styles.storyItem} onPress={onAddStory}>
        <View
          style={[
            styles.addCircle,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Avatar uri={null} name="Me" size={56} />
          <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        </View>
        <Text style={[styles.name, { color: colors.mutedForeground }]}>قصتك</Text>
      </TouchableOpacity>

      {stories.map((story) => (
        <TouchableOpacity
          key={story.id}
          style={styles.storyItem}
          onPress={() => onViewStory(story)}
        >
          <View
            style={[
              styles.storyRing,
              {
                borderColor: story.seen ? colors.border : colors.primary,
              },
            ]}
          >
            <Avatar uri={story.authorPhotoURL} name={story.authorName} size={56} />
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {story.authorName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    flexDirection: "row",
  },
  storyItem: { alignItems: "center", gap: 4, width: 66 },
  addCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  name: { fontSize: 11, fontWeight: "500", textAlign: "center" },
});
