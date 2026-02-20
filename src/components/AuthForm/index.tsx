import { View, Text, TextInput } from "react-native"
import { styles } from "./styled"
import CustomButton from "../Button"
import { COLORS } from "appStyles"

const AuthForm = () => {
    return (
        <View style={styles.centerContent}>

            <View style={styles.form}>
                <Text style={styles.title}>Вход</Text>

                <View style={styles.field}>
                    <View style={styles.preview}>

                        <Text style={styles.label}>Логин</Text>


                        <Text style={styles.error}>Ошибка</Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Введите логин"
                    />
                </View>


                <View style={styles.field}>
                    <View style={styles.preview}>

                        <Text style={styles.label}>Пароль</Text>


                        <Text style={styles.error}>Ошибка</Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Введите пароль"
                    />
                </View>

                <CustomButton
                    text="Войти"
                    fullWidth={false}
                    maxWidth={300}
                    handler={() => { }}
                />


                   <CustomButton
                    text="Зарегистрироваться"
                    fullWidth={false}
                    maxWidth={300}
                    handler={() => { }}
                    backgroundColor={COLORS.GRAY_LIGHT}
                    color={COLORS.BLACK}
                />

            </View>
        </View >
    )
}

export default AuthForm