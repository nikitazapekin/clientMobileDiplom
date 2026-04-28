import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS } from "appStyles";

import CodeEditor from "@/components/CodeEditor";
import type { ArticleBlock } from "@/http/types/community";

interface ArticleContentRendererProps {
  blocks: ArticleBlock[];
}

export default function ArticleContentRenderer({
  blocks,
}: ArticleContentRendererProps) {
  return (
    <View style={styles.content}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        const data = block.data || {};

        if (block.type === "text") {
          return (
            <Text key={key} style={styles.textBlock}>
              {data.text || ""}
            </Text>
          );
        }

        if (block.type === "image") {
          return (
            <View key={key} style={styles.mediaBlock}>
              {data.url ? <Image source={{ uri: data.url }} style={styles.image} /> : null}
              {data.caption ? <Text style={styles.caption}>{data.caption}</Text> : null}
            </View>
          );
        }

        if (block.type === "link") {
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              key={key}
              onPress={() => {
                if (data.url) {
                  void Linking.openURL(data.url);
                }
              }}
              style={styles.linkCard}
            >
              <Text style={styles.linkLabel}>{data.label || "Открыть ссылку"}</Text>
              <Text numberOfLines={1} style={styles.linkUrl}>
                {data.url || ""}
              </Text>
            </TouchableOpacity>
          );
        }

        if (block.type === "table") {
          const rows = Array.isArray(data.rows) ? (data.rows as string[][]) : [];

          return (
            <ScrollView horizontal={true} key={key} showsHorizontalScrollIndicator={false}>
              <View style={styles.tableCard}>
                {rows.map((row, rowIndex) => (
                  <View key={`${key}-row-${rowIndex}`} style={styles.tableRow}>
                    {row.map((cell, cellIndex) => (
                      <View
                        key={`${key}-cell-${rowIndex}-${cellIndex}`}
                        style={[
                          styles.tableCell,
                          rowIndex === 0 && styles.tableHeaderCell,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableCellText,
                            rowIndex === 0 && styles.tableHeaderText,
                          ]}
                        >
                          {cell}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          );
        }

        if (block.type === "code") {
          return (
            <View key={key} style={styles.codeBlock}>
              <Text style={styles.codeLabel}>Демо-код · {data.language || "typescript"}</Text>
              <CodeEditor
                height={260}
                language={(data.language || "typescript") as any}
                onChange={() => undefined}
                readOnly={true}
                value={data.code || ""}
              />
            </View>
          );
        }

        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  textBlock: {
    color: COLORS.GRAY_800,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 25,
  },
  mediaBlock: {
    gap: 10,
  },
  image: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 20,
    height: 220,
    width: "100%",
  },
  caption: {
    color: COLORS.GRAY_500,
    fontSize: 13,
  },
  linkCard: {
    backgroundColor: "#EEF7E8",
    borderRadius: 18,
    padding: 16,
  },
  linkLabel: {
    color: COLORS.PRIMARY,
    fontSize: FONTS.SIZE.SM,
    fontWeight: "700",
  },
  linkUrl: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    marginTop: 6,
  },
  tableCard: {
    borderColor: COLORS.GRAY_200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    borderBottomColor: COLORS.GRAY_200,
    borderBottomWidth: 1,
    borderRightColor: COLORS.GRAY_200,
    borderRightWidth: 1,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    backgroundColor: COLORS.GRAY_100,
  },
  tableCellText: {
    color: COLORS.GRAY_800,
    fontSize: 13,
  },
  tableHeaderText: {
    fontWeight: "700",
  },
  codeBlock: {
    gap: 10,
  },
  codeLabel: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    fontWeight: "700",
  },
});
