import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "./styled";
import type { FillCodeTaskOption } from "./types";

import {
  getFillTaskOptionValue,
  tokenizeFillTaskTemplate,
} from "@/code";

interface FillTaskInteractionProps {
  templateCode: string;
  answers: Record<string, string>;
  options: FillCodeTaskOption[];
  selectedOptionId: string | null;
  onSelectedOptionChange: (optionId: string | null) => void;
  onAssign: (slotId: string, optionId: string | null) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

interface MeasuredRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragInfo {
  optionId: string;
  label: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  containerX: number;
  containerY: number;
}

interface DraggableOptionChipProps {
  option: FillCodeTaskOption;
  selected: boolean;
  dragging: boolean;
  onPress: () => void;
  onDragStart: (option: FillCodeTaskOption, node: View | null, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (pageX: number, pageY: number) => void;
}

const measureInWindowAsync = (node: View | null): Promise<MeasuredRect | null> =>
  new Promise((resolve) => {
    if (!node || typeof node.measureInWindow !== "function") {
      resolve(null);

      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });

const formatCodeText = (value: string): string => {
  if (!value) {
    return "\u00A0";
  }

  return value.replace(/\t/g, "    ").replace(/ /g, "\u00A0");
};

function DraggableOptionChip({
  option,
  selected,
  dragging,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableOptionChipProps) {
  const optionRef = useRef<View>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: (event) => {
          onDragStart(
            option,
            optionRef.current,
            event.nativeEvent.pageX,
            event.nativeEvent.pageY
          );
        },
        onPanResponderMove: (event) => {
          onDragMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderRelease: (event) => {
          onDragEnd(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderTerminate: (event) => {
          onDragEnd(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [onDragEnd, onDragMove, onDragStart, option]
  );

  return (
    <View
      ref={optionRef}
      {...panResponder.panHandlers}
      style={dragging ? styles.fillTaskOptionChipGhost : undefined}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.fillTaskOptionChip,
          selected && styles.fillTaskOptionChipActive,
        ]}
        onPress={onPress}
      >
        <Text style={styles.fillTaskOptionChipText}>
          {option.value || "(пустое значение)"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function FillTaskInteraction({
  templateCode,
  answers,
  options,
  selectedOptionId,
  onSelectedOptionChange,
  onAssign,
  onDragStateChange,
}: FillTaskInteractionProps) {
  const templateLines = useMemo(
    () => tokenizeFillTaskTemplate(templateCode ?? ""),
    [templateCode]
  );
  const containerRef = useRef<View>(null);
  const slotRefs = useRef<Record<string, View | null>>({});
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragInfoRef = useRef<DragInfo | null>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  const setDragging = (value: DragInfo | null) => {
    dragInfoRef.current = value;
    setDragInfo(value);
    onDragStateChange?.(Boolean(value));
  };

  const findDropSlotId = async (pageX: number, pageY: number): Promise<string | null> => {
    const entries = Object.entries(slotRefs.current);

    for (const [slotId, node] of entries) {
      const rect = await measureInWindowAsync(node);

      if (
        rect &&
        pageX >= rect.x &&
        pageX <= rect.x + rect.width &&
        pageY >= rect.y &&
        pageY <= rect.y + rect.height
      ) {
        return slotId;
      }
    }

    return null;
  };

  const handleDragStart = async (
    option: FillCodeTaskOption,
    node: View | null,
    pageX: number,
    pageY: number
  ) => {
    const [containerRect, optionRect] = await Promise.all([
      measureInWindowAsync(containerRef.current),
      measureInWindowAsync(node),
    ]);

    if (!containerRect || !optionRect) {
      return;
    }

    const nextDragInfo: DragInfo = {
      optionId: option.id,
      label: option.value || "(пустое значение)",
      width: optionRect.width,
      height: optionRect.height,
      offsetX: pageX - optionRect.x,
      offsetY: pageY - optionRect.y,
      containerX: containerRect.x,
      containerY: containerRect.y,
    };

    dragPosition.setValue({
      x: optionRect.x - containerRect.x,
      y: optionRect.y - containerRect.y,
    });
    onSelectedOptionChange(option.id);
    setDragging(nextDragInfo);
  };

  const handleDragMove = (pageX: number, pageY: number) => {
    const currentDragInfo = dragInfoRef.current;

    if (!currentDragInfo) {
      return;
    }

    dragPosition.setValue({
      x: pageX - currentDragInfo.containerX - currentDragInfo.offsetX,
      y: pageY - currentDragInfo.containerY - currentDragInfo.offsetY,
    });
  };

  const handleDragEnd = async (pageX: number, pageY: number) => {
    const currentDragInfo = dragInfoRef.current;

    if (!currentDragInfo) {
      return;
    }

    const slotId = await findDropSlotId(pageX, pageY);

    if (slotId) {
      onAssign(slotId, currentDragInfo.optionId);
    }

    setDragging(null);
  };

  return (
    <View ref={containerRef} style={styles.fillTaskInteraction}>
      <View style={styles.fillTaskCodeSurface}>
        {templateLines.map((segments, lineIndex) => (
          <View key={`fill-line-${lineIndex}`} style={styles.fillTaskCodeLine}>
            {segments.map((segment, segmentIndex) => {
              if (segment.type === "text") {
                return (
                  <Text
                    key={`segment-${lineIndex}-${segmentIndex}`}
                    style={styles.fillTaskCodeText}
                  >
                    {formatCodeText(segment.value)}
                  </Text>
                );
              }

              const slotId = segment.value;
              const optionValue = getFillTaskOptionValue(options, answers[slotId]);
              const isFilled = Boolean(optionValue);

              return (
                <View
                  key={`slot-${lineIndex}-${segmentIndex}`}
                  ref={(node) => {
                    slotRefs.current[slotId] = node;
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.fillTaskCodeSlot,
                      isFilled && styles.fillTaskCodeSlotFilled,
                    ]}
                    onPress={() => {
                      if (selectedOptionId) {
                        onAssign(slotId, selectedOptionId);

                        return;
                      }

                      if (answers[slotId]) {
                        onAssign(slotId, null);
                      }
                    }}
                  >
                    <Text style={styles.fillTaskCodeSlotText}>
                      {optionValue || "\u00A0"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.fillTaskOptionBank}>
        {options.map((option) => (
          <DraggableOptionChip
            key={option.id}
            option={option}
            selected={selectedOptionId === option.id}
            dragging={dragInfo?.optionId === option.id}
            onPress={() =>
              onSelectedOptionChange(
                selectedOptionId === option.id ? null : option.id
              )
            }
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        ))}
      </View>

      {dragInfo && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fillTaskDragOverlay,
            {
              width: dragInfo.width,
              minHeight: dragInfo.height,
            },
            dragPosition.getLayout(),
          ]}
        >
          <Text style={styles.fillTaskOptionChipText}>{dragInfo.label}</Text>
        </Animated.View>
      )}
    </View>
  );
}
