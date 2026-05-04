import React from "react";
import {
  ScrollView,
 
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS, FONTS } from "appStyles";

import CodeEditor from "@/components/CodeEditor";
import type { ArticleBlock } from "@/http/types/community";
import { styles } from "./styles"
interface ArticleBlocksEditorProps {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}

const codeLanguages = [
  "javascript",
  "typescript",
  "python",
  "php",
  "ruby",
  "rust",
  "java",
  "csharp",
  "golang",
  "cpp",
] as const;

const createBlockByType = (type: ArticleBlock["type"]): ArticleBlock => {
  switch (type) {
    case "text":
      return { type, data: { text: "" } };

    case "image":
      return { type, data: { url: "", caption: "" } };

    case "link":
      return { type, data: { url: "", label: "" } };

    case "table":
      return { type, data: { rows: [["", ""], ["", ""]] } };

    case "code":
      return { type, data: { language: "typescript", code: "" } };

    default:
      return { type: "text", data: { text: "" } };
  }
};

const blockTitleMap: Record<ArticleBlock["type"], string> = {
  text: "Текст",
  image: "Картинка",
  link: "Ссылка",
  table: "Таблица",
  code: "Демо-код",
};

export default function ArticleBlocksEditor({
  blocks,
  onChange,
}: ArticleBlocksEditorProps) {
  const updateBlock = (index: number, nextBlock: ArticleBlock) => {
    onChange(blocks.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlocks = [...blocks];

    [nextBlocks[index], nextBlocks[nextIndex]] = [nextBlocks[nextIndex], nextBlocks[index]];
    onChange(nextBlocks);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  };

  const addBlock = (type: ArticleBlock["type"]) => {
    onChange([...blocks, createBlockByType(type)]);
  };

  const updateTableRows = (index: number, rows: string[][]) => {
    updateBlock(index, {
      ...blocks[index],
      data: {
        ...blocks[index].data,
        rows,
      },
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.addBar}>
        {(["text", "image", "link", "table", "code"] as ArticleBlock["type"][]).map((type) => (
          <TouchableOpacity
            activeOpacity={0.85}
            key={type}
            onPress={() => addBlock(type)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ {blockTitleMap[type]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.blocksWrap}>
        {blocks.map((block, index) => {
          const data = block.data || {};
          const rows = Array.isArray(data.rows) ? (data.rows as string[][]) : [["", ""]];

          return (
            <View key={`${block.type}-${index}`} style={styles.blockCard}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>
                  {index + 1}. {blockTitleMap[block.type]}
                </Text>

                <View style={styles.blockHeaderActions}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => moveBlock(index, -1)}
                    style={styles.headerActionButton}
                  >
                    <Text style={styles.headerActionText}>Вверх</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => moveBlock(index, 1)}
                    style={styles.headerActionButton}
                  >
                    <Text style={styles.headerActionText}>Вниз</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => deleteBlock(index)}
                    style={styles.headerDangerButton}
                  >
                    <Text style={styles.headerDangerText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {block.type === "text" ? (
                <TextInput
                  multiline={true}
                  onChangeText={(text) =>
                    updateBlock(index, {
                      ...block,
                      data: { ...data, text },
                    })
                  }
                  placeholder="Основной текст статьи"
                  placeholderTextColor={COLORS.GRAY_400}
                  style={[styles.input, styles.textArea]}
                  value={data.text || ""}
                />
              ) : null}

              {block.type === "image" ? (
                <View style={styles.fieldGroup}>
                  <TextInput
                    onChangeText={(url) =>
                      updateBlock(index, {
                        ...block,
                        data: { ...data, url },
                      })
                    }
                    placeholder="URL изображения"
                    placeholderTextColor={COLORS.GRAY_400}
                    style={styles.input}
                    value={data.url || ""}
                  />

                  <TextInput
                    onChangeText={(caption) =>
                      updateBlock(index, {
                        ...block,
                        data: { ...data, caption },
                      })
                    }
                    placeholder="Подпись к изображению"
                    placeholderTextColor={COLORS.GRAY_400}
                    style={styles.input}
                    value={data.caption || ""}
                  />
                </View>
              ) : null}

              {block.type === "link" ? (
                <View style={styles.fieldGroup}>
                  <TextInput
                    onChangeText={(url) =>
                      updateBlock(index, {
                        ...block,
                        data: { ...data, url },
                      })
                    }
                    placeholder="https://example.com"
                    placeholderTextColor={COLORS.GRAY_400}
                    style={styles.input}
                    value={data.url || ""}
                  />

                  <TextInput
                    onChangeText={(label) =>
                      updateBlock(index, {
                        ...block,
                        data: { ...data, label },
                      })
                    }
                    placeholder="Подпись ссылки"
                    placeholderTextColor={COLORS.GRAY_400}
                    style={styles.input}
                    value={data.label || ""}
                  />
                </View>
              ) : null}

              {block.type === "table" ? (
                <View style={styles.tableEditorWrap}>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.tableEditor}>
                      {rows.map((row, rowIndex) => (
                        <View key={`row-${rowIndex}`} style={styles.tableRow}>
                          {row.map((cell, cellIndex) => (
                            <TextInput
                              key={`cell-${rowIndex}-${cellIndex}`}
                              onChangeText={(text) => {
                                const nextRows = rows.map((currentRow) => [...currentRow]);

                                nextRows[rowIndex][cellIndex] = text;
                                updateTableRows(index, nextRows);
                              }}
                              placeholder="Ячейка"
                              placeholderTextColor={COLORS.GRAY_400}
                              style={[styles.input, styles.tableInput]}
                              value={cell}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.tableActions}>
                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() => updateTableRows(index, [...rows, new Array(rows[0]?.length || 2).fill("")])}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Добавить строку</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() =>
                        updateTableRows(
                          index,
                          rows.map((row) => [...row, ""]),
                        )
                      }
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Добавить столбец</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {block.type === "code" ? (
                <View style={styles.fieldGroup}>
                  <View style={styles.pickerWrap}>
                    <Picker
                      onValueChange={(language) =>
                        updateBlock(index, {
                          ...block,
                          data: { ...data, language },
                        })
                      }
                      selectedValue={data.language || "typescript"}
                    >
                      {codeLanguages.map((language) => (
                        <Picker.Item key={language} label={language} value={language} />
                      ))}
                    </Picker>
                  </View>

                  <CodeEditor
                    height={260}
                    language={(data.language || "typescript") as any}
                    onChange={(code) =>
                      updateBlock(index, {
                        ...block,
                        data: { ...data, code },
                      })
                    }
                    value={data.code || ""}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
 