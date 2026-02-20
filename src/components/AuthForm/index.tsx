import { View, Text, TextInput, Alert } from "react-native";
import { styles } from "./styled";
import CustomButton from "../Button";
import { COLORS } from "appStyles";
import { useNavigation } from "@react-navigation/native";
import { FormNavigationProp } from "@/navigation/types";
import { ROUTES } from "@/navigation/routes";
import { z } from "zod";
import { useState } from "react";
import AuthService from "@/http/auth";

const AuthSchema = z.object({
  login: z.string().min(3, "Логин должен содержать минимум 3 символа"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

type AuthFormData = z.infer<typeof AuthSchema>;

const AuthForm = () => {
  const navigation = useNavigation<FormNavigationProp>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<AuthFormData>>({
    login: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      AuthSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof AuthFormData, string>> = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof AuthFormData;
          formattedErrors[field] = err.message;
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        await AuthService.login(formData as AuthFormData);
        navigation.navigate(ROUTES.STACK.PROFILE);
      } catch (error: any) {
        Alert.alert("Ошибка", error.message || "Не удалось войти");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNavigateToRegister = () => {
    navigation.navigate(ROUTES.STACK.REGISTER);
  };

  const renderField = (
    label: string,
    field: keyof AuthFormData,
    placeholder: string,
    secureTextEntry?: boolean
  ) => (
    <View style={styles.field}>
      <View style={styles.preview}>
        <Text style={styles.label}>{label}</Text>
        {errors[field] && <Text style={styles.error}>{errors[field]}</Text>}
      </View>
      <TextInput
        style={[styles.input]}
        placeholder={placeholder}
        value={formData[field] as string}
        onChangeText={(value) => handleInputChange(field, value)}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        editable={!loading}
      />
    </View>
  );

  return (
    <View style={styles.centerContent}>
      <View style={styles.form}>
        <Text style={styles.title}>Вход</Text>

        {renderField("Email", "login", "Введите email")}
        {renderField("Пароль", "password", "Введите пароль", true)}

        <CustomButton
          text={loading ? "Вход..." : "Войти"}
          fullWidth={false}
          maxWidth={300}
          handler={handleLogin}
          disabled={loading}
        />

        <CustomButton
          text="Зарегистрироваться"
          fullWidth={false}
          maxWidth={300}
          handler={handleNavigateToRegister}
          backgroundColor={COLORS.GRAY_LIGHT}
          color={COLORS.BLACK}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default AuthForm;