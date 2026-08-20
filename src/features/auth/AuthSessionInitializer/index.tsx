import { useEffect } from "react";

import { useAuthStore } from "../store/useAuthStore";

const AuthSessionInitializer = () => {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return null;
};

export default AuthSessionInitializer;
