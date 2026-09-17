import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "NETRA-user";
const TOKEN_STORAGE_KEY = "NETRA-token";

const DEFAULT_DEMO_USER = {
  id: "KP-ADMIN-001",
  name: "State Police",
  initials: "KP",
  email: "analyst@NETRA.ai",
  employeeId: "KP-ADMIN-001",
  role: "Crime Intelligence Analyst",
  department: "State Police",
  district: "All Districts",
  phone: "Not provided",
  lastLogin: null,
};

function readStoredUser() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(USER_STORAGE_KEY) || "null",
    );

    return saved && typeof saved === "object"
      ? saved
      : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setLoading(false);
  }, []);

  function login({ email, password }) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error("Email and password are required.");
    }

    const validEmail =
      normalizedEmail === "analyst@netra.ai";

    const validPassword =
      normalizedPassword === "NETRA@123";

    if (!validEmail || !validPassword) {
      throw new Error("Invalid email or password.");
    }

    const authenticatedUser = {
      ...DEFAULT_DEMO_USER,
      email: normalizedEmail,
      lastLogin: new Date().toISOString(),
    };

    const demoToken = `NETRA-demo-${Date.now()}`;

    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(authenticatedUser),
    );

    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      demoToken,
    );

    setUser(authenticatedUser);

    window.dispatchEvent(
      new CustomEvent("NETRA-auth-updated", {
        detail: authenticatedUser,
      }),
    );

    return authenticatedUser;
  }

  function logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    setUser(null);

    window.dispatchEvent(
      new CustomEvent("NETRA-auth-updated", {
        detail: null,
      }),
    );
  }

  const updateProfile = useCallback(
    (updates) => {
      const updatedUser = {
        ...user,
        ...updates,
      };

      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(updatedUser),
      );

      setUser(updatedUser);

      window.dispatchEvent(
        new CustomEvent("NETRA-auth-updated", {
          detail: updatedUser,
        }),
      );

      return updatedUser;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateProfile,
    }),
    [user, loading, updateProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}