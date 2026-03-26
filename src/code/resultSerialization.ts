export const JAVA_SERIALIZATION_HELPERS = `
    private static String __codexEscapeJson(String value) {
        StringBuilder escaped = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            switch (ch) {
                case '\\\\':
                    escaped.append("\\\\\\\\");
                    break;
                case '"':
                    escaped.append('\\\\').append('"');
                    break;
                case '\\n':
                    escaped.append("\\\\n");
                    break;
                case '\\r':
                    escaped.append("\\\\r");
                    break;
                case '\\t':
                    escaped.append("\\\\t");
                    break;
                case '\\b':
                    escaped.append("\\\\b");
                    break;
                case '\\f':
                    escaped.append("\\\\f");
                    break;
                default:
                    if (ch < 32) {
                        escaped.append(String.format("\\\\u%04x", (int) ch));
                    } else {
                        escaped.append(ch);
                    }
            }
        }
        return escaped.toString();
    }

    private static String __codexSerializeResult(Object value) {
        return __codexSerializeResult(value, new java.util.IdentityHashMap<Object, Boolean>());
    }

    private static String __codexSerializeResult(Object value, java.util.IdentityHashMap<Object, Boolean> visited) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String || value instanceof Character || value instanceof Enum<?>) {
            return '"' + __codexEscapeJson(String.valueOf(value)) + '"';
        }
        if (value instanceof Double && !Double.isFinite((Double) value)) {
            return '"' + String.valueOf(value) + '"';
        }
        if (value instanceof Float && !Float.isFinite((Float) value)) {
            return '"' + String.valueOf(value) + '"';
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }

        Class<?> valueClass = value.getClass();

        if (valueClass.isArray()) {
            int length = java.lang.reflect.Array.getLength(value);
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < length; i++) {
                if (i > 0) {
                    json.append(",");
                }
                json.append(__codexSerializeResult(java.lang.reflect.Array.get(value, i), visited));
            }
            json.append("]");
            return json.toString();
        }

        if (value instanceof java.util.Collection<?>) {
            StringBuilder json = new StringBuilder("[");
            int index = 0;
            for (Object item : (java.util.Collection<?>) value) {
                if (index > 0) {
                    json.append(",");
                }
                json.append(__codexSerializeResult(item, visited));
                index++;
            }
            json.append("]");
            return json.toString();
        }

        if (value instanceof java.util.Map<?, ?>) {
            java.util.List<java.util.Map.Entry<?, ?>> entries =
                new java.util.ArrayList<>(((java.util.Map<?, ?>) value).entrySet());
            entries.sort(java.util.Comparator.comparing(entry -> String.valueOf(entry.getKey())));

            StringBuilder json = new StringBuilder("{");
            boolean first = true;
            for (java.util.Map.Entry<?, ?> entry : entries) {
                if (!first) {
                    json.append(",");
                }
                json.append('"')
                    .append(__codexEscapeJson(String.valueOf(entry.getKey())))
                    .append('"')
                    .append(':')
                    .append(__codexSerializeResult(entry.getValue(), visited));
                first = false;
            }
            json.append("}");
            return json.toString();
        }

        if (visited.containsKey(value)) {
            return '"' + "[Circular]" + '"';
        }

        visited.put(value, Boolean.TRUE);
        try {
            java.util.List<java.lang.reflect.Field> fields = new java.util.ArrayList<>();
            Class<?> current = valueClass;

            while (current != null && current != Object.class) {
                for (java.lang.reflect.Field field : current.getDeclaredFields()) {
                    int modifiers = field.getModifiers();
                    if (!java.lang.reflect.Modifier.isStatic(modifiers) && !field.isSynthetic()) {
                        fields.add(field);
                    }
                }
                current = current.getSuperclass();
            }

            fields.sort(java.util.Comparator.comparing(java.lang.reflect.Field::getName));

            StringBuilder json = new StringBuilder("{");
            boolean first = true;
            for (java.lang.reflect.Field field : fields) {
                if (!first) {
                    json.append(",");
                }
                field.setAccessible(true);
                json.append('"')
                    .append(__codexEscapeJson(field.getName()))
                    .append('"')
                    .append(':')
                    .append(__codexSerializeResult(field.get(value), visited));
                first = false;
            }
            json.append("}");
            return json.toString();
        } catch (IllegalAccessException error) {
            return '"' + __codexEscapeJson(String.valueOf(value)) + '"';
        } finally {
            visited.remove(value);
        }
    }

    private static String __codexSerializeError(Exception error) {
        return "{" + '"' + "error" + '"' + ":" + __codexSerializeResult(error.getMessage()) + "}";
    }
`;
