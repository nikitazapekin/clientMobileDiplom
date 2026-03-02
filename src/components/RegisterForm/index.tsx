import { useState } from "react";
import { Alert, ScrollView,Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "appStyles";
import { z } from "zod";

import CustomButton from "../Button";

import { styles } from "./styled";

import AuthService from "@/http/auth";
import { ROUTES } from "@/navigation/routes";
import type { FormNavigationProp } from "@/navigation/types";

const RegisterSchema = z.object({
  email: z.string().email("Некорректный формат почты"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  lastName: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
  middleName: z.string().optional(),
  phone: z.string().min(10, "Телефон должен содержать минимум 10 символов"),
  country: z.string().min(2, "Страна должна содержать минимум 2 символа"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof RegisterSchema>;

const RegisterForm = () => {
  const navigation = useNavigation<FormNavigationProp>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<RegisterFormData>>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    country: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      RegisterSchema.parse(formData);
      setErrors({});

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof RegisterFormData, string>> = {};

        error.issues.forEach((err) => {
          const field = err.path[0] as keyof RegisterFormData;

          formattedErrors[field] = err.message;
        });
        setErrors(formattedErrors);
      }

      return false;
    }
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        await AuthService.register(formData as RegisterFormData);
        Alert.alert("Успех", "Регистрация прошла успешно", [
          { text: "OK", onPress: () => navigation.navigate(ROUTES.STACK.MAIN) }
        ]);
      } catch (error: any) {
        Alert.alert("Ошибка", error.message || "Не удалось зарегистрироваться");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate(ROUTES.STACK.AUTH);
  };

  const renderField = (
    label: string,
    field: keyof RegisterFormData,
    placeholder: string,
    secureTextEntry?: boolean,
    required: boolean = true
  ) => (
    <View style={styles.field}>
      <View style={styles.preview}>
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}>*</Text>}
        </Text>
        {errors[field] && <Text style={styles.error}>{errors[field]}</Text>}
      </View>
      <TextInput
        style={[styles.input]}
        placeholder={placeholder}
        value={formData[field] as string}
        onChangeText={(value) => handleInputChange(field, value)}
        secureTextEntry={secureTextEntry}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        keyboardType={
          field === 'phone' ? 'phone-pad' :
            field === 'email' ? 'email-address' :
              'default'
        }
        editable={!loading}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.centerContent}>
      <View style={styles.form}>
        <Text style={styles.title}>Регистрация</Text>

        {renderField("Email", "email", "Введите email")}
        {renderField("Пароль", "password", "Введите пароль", true)}
        {renderField("Подтвердите пароль", "confirmPassword", "Подтвердите пароль", true)}
        {renderField("Имя", "firstName", "Введите имя")}
        {renderField("Фамилия", "lastName", "Введите фамилию")}
        {renderField("Отчество", "middleName", "Введите отчество (необязательно)", false, false)}
        {renderField("Телефон", "phone", "Введите номер телефона")}
        {renderField("Страна", "country", "Введите страну")}

        <CustomButton
          text={loading ? "Регистрация..." : "Зарегистрироваться"}
          fullWidth={false}
          maxWidth={300}
          handler={handleRegister}
          backgroundColor={"#9F0FA7"}
          color={COLORS.WHITE}
          disabled={loading}
        />

        <CustomButton
          text="Уже есть аккаунт? Войти"
          fullWidth={false}
          maxWidth={300}
          handler={handleNavigateToLogin}
          backgroundColor={COLORS.GRAY_LIGHT}
          color={COLORS.BLACK}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
};

export default RegisterForm;
