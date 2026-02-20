import { COLORS } from "appStyles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    form: {
        borderRadius: 10,
        backgroundColor: COLORS.WHITE,
        padding: 20,
        maxWidth: 350,
        width: "100%",
        //  flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 10
    },

    field: {
        flexDirection: "column",
        gap: 5,
        width: "100%"
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: COLORS.BLACK,
    },
preview: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",     // Для позиционирования ошибки
    minHeight: 20,            // Минимальная высота для ошибки
   // backgroundColor: "red",

    gap: 10,
},

label: {
    // Лейбл слева
    zIndex: 1,
},

error: {
    color: COLORS.ERROR,
      maxWidth: 200,   

       textAlign: "right",
 
    
},


required: {
        color: COLORS.ERROR,
        marginLeft: 2,
    },
    input: {

        borderRadius: 5,
        padding: 3,
        backgroundColor: COLORS.GRAY_LIGHT,

        width: "100%",

        height: 40
    },


   
    inputError: {
        backgroundColor: COLORS.ERROR,
        opacity: 0.8,
    },
});