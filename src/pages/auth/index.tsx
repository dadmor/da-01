// src/pages/auth/index.tsx
import { Route } from "react-router";
import { LoginPage } from "./login";
import { RegisterPage } from "./register";
import { ForgotPasswordPage } from "./forgot-password";
import { UpdatePasswordPage } from "./update-password";
import { RegisterStep1 } from "./RegisterStep1";
import { RegisterStep2 } from "./RegisterStep2";
import { RegisterStep3 } from "./RegisterStep3";
import { RegisterStep4 } from "./RegisterStep4";


// Komponenty - eksportuj wszystkie
export { LoginPage } from './login';
export { RegisterPage } from './register';
export { ForgotPasswordPage } from './forgot-password';
export { UpdatePasswordPage } from './update-password';
export { RegisterStep1 } from './RegisterStep1';
export { RegisterStep2 } from './RegisterStep2';
export { RegisterStep3 } from './RegisterStep3';
export { RegisterStep4 } from './RegisterStep4';


// Routes - zwracamy JSX bezpośrednio, nie funkcję komponenta
export const authRoutes = [
  <Route key="auth-login" path="/login" element={<LoginPage />} />,
  <Route key="auth-register" path="/register" element={<RegisterPage />} />,
  <Route key="auth-forgot-password" path="/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="auth-update-password" path="/update-password" element={<UpdatePasswordPage />} />,
  <Route key="auth-register-1" path="/register/step1" element={<RegisterStep1 />} />,
  <Route key="auth-register-2" path="/register/step2" element={<RegisterStep2 />} />,
  <Route key="auth-register-3" path="/register/step3" element={<RegisterStep3 />} />,
  <Route key="auth-register-4" path="/register/step4" element={<RegisterStep4 />} />,
];