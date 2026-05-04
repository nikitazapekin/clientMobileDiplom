import React from "react";
import {
  Image,
  Linking,
  ScrollView,
 
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./styles";

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

 