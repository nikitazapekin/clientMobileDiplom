import type { ArgumentSchema, CodeLanguage } from "@/components/Lesson/types";

export const getCSharpType = (type: string): string => {
  const typeMap: Record<string, string> = {
    int: "int",
    string: "string",
    number: "int",
    boolean: "bool",
    double: "double",
    float: "float",
    long: "long",
    char: "char",
    byte: "byte",
    short: "short",
    object: "object",
    array: "object[]",
    list: "List<object>",
  };

  return typeMap[type] || "object";
};

export const getJavaType = (type: string): string => {
  const typeMap: Record<string, string> = {
    int: "int",
    string: "String",
    number: "int",
    boolean: "boolean",
    double: "double",
    float: "float",
    long: "long",
    char: "char",
    byte: "byte",
    short: "short",
    object: "Object",
    array: "Object[]",
    list: "List<Object>",
  };

  return typeMap[type] || "Object";
};

export const getTypeScriptType = (type: string): string => {
  const typeMap: Record<string, string> = {
    int: "number",
    string: "string",
    number: "number",
    boolean: "boolean",
    double: "number",
    float: "number",
    long: "number",
    char: "string",
    byte: "number",
    short: "number",
    object: "Record<string, unknown>",
    array: "number[]",
    list: "Array<unknown>",
  };

  return typeMap[type] || "unknown";
};

export const generateObjectClasses = (args: ArgumentSchema[], language: CodeLanguage): string => {
  const objectArgs = args.filter((a) => a.type === "object" && a.objectFields);

  const arrayObjectArgs = args.filter(
    (a) => (a.type === "array" || a.type === "list") &&
           a.arrayElementType === "object" &&
           a.arrayElementObjectFields
  );

  const allClasses = [...objectArgs, ...arrayObjectArgs];

  if (allClasses.length === 0) return "";

  return allClasses
    .map((arg) => {
      let className: string;
      const objectFields = arg.objectFields ?? arg.arrayElementObjectFields ?? [];

      if (arg.objectFields) {
        className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      } else if (arg.arrayElementObjectFields) {
        className = arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      } else {
        className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      }

      if (language === "csharp") {
        const fields = objectFields.map((f) => `        public ${getCSharpType(f.type)} ${f.name};`).join("\n");
        const constructorParams = objectFields.map(f => `${getCSharpType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          .map((f) => {
            const fieldName = f.name;
            const fieldType = getCSharpType(f.type);

            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");

        return `public class ${className} {
${fields.replace(/ {8}/g, "    ")}
${constructor.replace(/ {8}/g, "    ")}
${gettersSetters}
}`;
      }

      if (language === "java") {
        const fields = objectFields.map((f) => `        private ${getJavaType(f.type)} ${f.name};`).join("\n");
        const constructorParams = objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          .map((f) => {
            const fieldName = f.name;
            const fieldType = getJavaType(f.type);

            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");

        return `    class ${className} {
${fields}
${constructor}
${gettersSetters}
    }`;
      }

      if (language === "typescript") {
        const fields = objectFields
          .map((f) => `  public ${f.name}: ${getTypeScriptType(f.type)};`)
          .join("\n");
        const constructorParams = objectFields
          .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
          .join(", ");
        const constructorBody = objectFields
          .map((f) => `    this.${f.name} = ${f.name};`)
          .join("\n");

        return `class ${className} {
${fields}

  constructor(${constructorParams}) {
${constructorBody}
  }
}`;
      }

      return "";
    })
    .join("\n\n");
};

export const generateObjectClassesForPreview = (args: ArgumentSchema[], language: CodeLanguage): string => {
  const objectArgs = args.filter((a) => a.type === "object" && a.objectFields);
  const arrayObjectArgs = args.filter(
    (a) => (a.type === "array" || a.type === "list") &&
           a.arrayElementType === "object" &&
           a.arrayElementObjectFields
  );
  const allClasses = [...objectArgs, ...arrayObjectArgs];

  if (allClasses.length === 0) return "";

  return allClasses
    .map((arg) => {
      const className = arg.objectFields
        ? (arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1))
        : (arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1));
      const objectFields = arg.objectFields ?? arg.arrayElementObjectFields ?? [];

      if (language === "java") {
        const fields = objectFields
          ?.map((f) => `    private ${getJavaType(f.type)} ${f.name};`)
          .join("\n");
        const constructorParams = objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          ?.map((f) => {
            const fieldName = f.name;
            const fieldType = getJavaType(f.type);

            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");

        return `class ${className} {
${fields}
${constructor}
${gettersSetters}
}`;
      }

      if (language === "csharp") {
        const fields = objectFields
          ?.map((f) => `    private ${getCSharpType(f.type)} ${f.name};`)
          .join("\n");
        const constructorParams = objectFields.map(f => `${getCSharpType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          ?.map((f) => {
            const fieldName = f.name;
            const fieldType = getCSharpType(f.type);

            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");

        return `public class ${className} {
${fields}
${constructor}
${gettersSetters}
}`;
      }

      if (language === "typescript") {
        const fields = objectFields
          ?.map((f) => `  public ${f.name}: ${getTypeScriptType(f.type)};`)
          .join("\n");
        const constructorParams = objectFields
          .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
          .join(", ");
        const constructorBody = objectFields
          .map((f) => `    this.${f.name} = ${f.name};`)
          .join("\n");

        return `class ${className} {
${fields}

  constructor(${constructorParams}) {
${constructorBody}
  }
}`;
      }

      return "";
    })
    .join("\n\n");
};

export const getArgumentTypeDescription = (arg: ArgumentSchema): string => {
  if (arg.type === "object" && arg.objectFields) {
    const className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
    const fields = arg.objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");

    return `${className} (${fields})`;
  }

  if (arg.type && arg.type.startsWith("array_")) {
    const elementType = arg.type.replace("array_", "");

    return `${elementType}[]`;
  }

  if (arg.type === "array" || arg.type === "list") {
    if (arg.arrayElementType === "object" && arg.arrayElementObjectFields) {
      const className = arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      const fields = arg.arrayElementObjectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");

      return `${className}[] (${fields})`;
    }

    return `${arg.arrayElementType || "object"}[]`;
  }

  return arg.type || "unknown";
};

export const renderArgumentScheme = (args: ArgumentSchema[], _language: CodeLanguage): string => {
  if (!args || args.length === 0) return "";

  return args.map((arg, idx) => {
    const typeDesc = getArgumentTypeDescription(arg);

    return `${idx + 1}. ${arg.name}: ${typeDesc}`;
  }).join("\n");
};
