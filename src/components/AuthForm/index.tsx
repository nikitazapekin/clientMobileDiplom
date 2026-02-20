import { View, Text, TextInput,   } from "react-native"
import { styles } from "./styled"
import CustomButton from "../Button"
import { COLORS } from "appStyles"
import { useNavigation } from "@react-navigation/native"
import { FormNavigationProp } from "@/navigation/types"
import { ROUTES } from "@/navigation/routes"
import { z } from "zod"
import { useState } from "react"

const AuthSchema = z.object({
    login: z.string().min(3, "Логин должен содержать минимум 3 символа"),
    password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

type AuthFormData = z.infer<typeof AuthSchema>;

const AuthForm = () => {
    const navigation = useNavigation<FormNavigationProp>();

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

    const handleLogin = () => {
        if (validateForm()) {
            console.log("Valid form data:", formData);
            handleNavigateToProfile();
        }
    };

    const handleNavigateToProfile = () => {
        navigation.navigate(ROUTES.STACK.PROFILE);
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
                style={[styles.input,  ]}
                placeholder={placeholder}
                value={formData[field] as string}
                onChangeText={(value) => handleInputChange(field, value)}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
            />
        </View>
    );

    return (
        <View style={styles.centerContent}>
            <View style={styles.form}>
                <Text style={styles.title}>Вход</Text>

                {renderField("Логин", "login", "Введите логин")}
                {renderField("Пароль", "password", "Введите пароль", true)}

                <CustomButton
                    text="Войти"
                    fullWidth={false}
                    maxWidth={300}
                    handler={handleLogin}
                />

                <CustomButton
                    text="Зарегистрироваться"
                    fullWidth={false}
                    maxWidth={300}
                    handler={handleNavigateToRegister}
                    backgroundColor={COLORS.GRAY_LIGHT}
                    color={COLORS.BLACK}
                />
            </View>
        </View>
    )
}

export default AuthForm