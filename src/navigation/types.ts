import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

import type { ROUTES } from "./routes";

import type { Doctor } from "@/components/UserCatalogDoctorsComponent/types";
import type { DoctorResponse } from "@/http/types/doctor";

export type RootStackParamList = {
  Home: undefined;
  [ROUTES.STACK.MAIN]: undefined;
  [ROUTES.STACK.AUTH]: undefined;
  [ROUTES.STACK.REGISTER]: undefined;
  [ROUTES.STACK.HOMEPAGE]: undefined;
  [ROUTES.STACK.CATALOG]: undefined;
  [ROUTES.STACK.CHAT]: { id: number, chatId: number };
  [ROUTES.STACK.CHATS]: undefined;
  [ROUTES.STACK.MED]: undefined;
  [ROUTES.STACK.TUBE]: undefined;
  [ROUTES.STACK.CABINET]: undefined;
  [ROUTES.STACK.PAYMENTS]: { id: number };
  [ROUTES.STACK.DOCTOR]: undefined;
  [ROUTES.STACK.DOCTOR_CHAT]: { id: number };
  [ROUTES.STACK.DOCTOR_CABINET]: undefined;
  [ROUTES.STACK.DOCTOR_APPOINTMENTS]: undefined;
  [ROUTES.STACK.DOCTOR_CABINET_EDIT]: undefined;
  [ROUTES.STACK.CHILDRENS]: undefined;
  [ROUTES.STACK.CHILDREN]:  { id: number };
  [ROUTES.STACK.CHILDREN_DOCTORS]: { childId: number };
  [ROUTES.STACK.CHILDREN_INFORMATION_ABOUT_CLINIC]: { childId: number };
  [ROUTES.STACK.SPISOKSOVETOV]: undefined;
  [ROUTES.STACK.CHILDREN_HEALTH_STATUS]: { childId: number };
  [ROUTES.STACK.MEDICALCARD]: { id: number };
  [ROUTES.STACK.USER_FAVOURITE_DRUGS]: { id: number };
  [ROUTES.STACK.USER_ANALYZE_HISTORY]:  { id: number, selectedDate: string  };
  [ROUTES.STACK.USER_ISTORIA_PRIEMOV]:  { id: number , selectedDate: string  };
  [ROUTES.STACK.ISTORIABOLEZNEI]:  { id: number, selectedDate: string };

  [ROUTES.STACK.USER_RECOMMENDATIONS]: undefined;
  [ROUTES.STACK.USER_EDIT_PROFILE]: undefined;
  [ROUTES.STACK.USER_CATALOG_DOCTORS]: { serviceName?: string; serviceId?: number; showPopular?: boolean } | undefined;
  [ROUTES.STACK.USER_CATALOG_SERVICES]: undefined;
  [ROUTES.STACK.USER_CATALOG_RECOMMENDATIONS]: undefined;
  [ROUTES.STACK.USER_CATALOG_FULL_RECOMENDATION]: {
    recommendationId: number;
  };
  [ROUTES.STACK.USER_APPOINTMENTS]: undefined;
  [ROUTES.STACK.USER_APPOINTMENT_DETAILS]: { appointmentId: number };
  [ROUTES.STACK.USER_EDIT_CHILDRESN]: { id: number };
  [ROUTES.STACK.USER_ABOUT_DOCTOR]: {
    doctor: DoctorResponse | Doctor;
    serviceName?: string;
    serviceId?: number;
  };
  [ROUTES.STACK.USER_REGISTRATION_AT_CLINIC]: {
    doctor: DoctorResponse | Doctor;
    serviceName?: string;
    serviceId?: number;
    appointmentId?: number;
  };
  [ROUTES.STACK.USER_REGISTRATION_SUMMARY]: {
    doctor: Doctor;
    selectedDate: string | null;
    selectedTime: string | null;
    serviceName?: string;
    serviceId?: number;
    appointmentId?: number;
  };
  [ROUTES.STACK.CHILD_SELECTION]: undefined;
  [ROUTES.STACK.USER_POPULAR_DOCTORS]: { showPopular: boolean; serviceName?: string; serviceId?: number };
  [ROUTES.STACK.USER_DRUG_DETAIL_SCREEN]: {
    drug: {
      id: number;
      title: string;
      shortDescription?: string;
      description: string;
      price: number;
      type: string;
      dosage: string;
      imagePath?: string;
    };
    isFavourite?: boolean;
    favouriteId?: number;
  };
  [ROUTES.STACK.USER_SPISOK_SOVETOV]: undefined;
  [ROUTES.STACK.USER_OPROS]:  { id: number };
  [ROUTES.STACK.DOCTOR_RECORD_DETAIL]: {
    record: {
      id: string;
      time: string;
      patient: string;
      service: string;
    };
  };
};
export type FormNavigationProp = StackNavigationProp<RootStackParamList>;

export type UserEditChildrenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.STACK.USER_EDIT_CHILDRESN>;
