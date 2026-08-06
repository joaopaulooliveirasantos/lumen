import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "../state/AuthContext";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

type Mode = "entrar" | "cadastrar";

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
  onExit: () => void;
};

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ERR_REQUEST_CANCELED") {
    return "";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export function AuthScreen({ theme, settings, onExit }: Props) {
  const { signUp, signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const inputStyle = [
    styles.input,
    { borderColor: theme.border, color: theme.titleText, backgroundColor: theme.cardBackground },
  ];

  async function handleSubmit(): Promise<void> {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatorios", "Informe email e senha.");
      return;
    }
    if (mode === "cadastrar" && password !== confirmPassword) {
      Alert.alert("Senhas diferentes", "A confirmacao de senha precisa ser igual a senha.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "cadastrar") {
        const { needsEmailConfirmation } = await signUp(email.trim(), password, name.trim());
        if (needsEmailConfirmation) {
          setConfirmationSent(true);
        } else {
          onExit();
        }
      } else {
        await signIn(email.trim(), password);
        onExit();
      }
    } catch (error) {
      const message = errorMessage(error);
      if (message) Alert.alert("Nao foi possivel continuar", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onExit();
    } catch (error) {
      const message = errorMessage(error);
      if (message) Alert.alert("Nao foi possivel continuar com o Google", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApple(): Promise<void> {
    setSubmitting(true);
    try {
      await signInWithApple();
      onExit();
    } catch (error) {
      const message = errorMessage(error);
      if (message) Alert.alert("Nao foi possivel continuar com a Apple", message);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationSent) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.appBackground }]}>
        <View style={styles.centerBox}>
          <Text allowFontScaling style={[styles.title, { color: theme.titleText }]}>
            Verifique seu email
          </Text>
          <Text allowFontScaling style={[styles.bodyText, { color: theme.mutedText }]}>
            Enviamos um link de confirmacao para {email.trim()}. Abra o email e toque no link para
            ativar sua conta antes de entrar.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={onExit}
          >
            <Text allowFontScaling style={styles.primaryButtonText}>
              Voltar
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.appBackground }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={onExit}
          style={styles.closeBtn}
        >
          <Text style={[styles.closeText, { color: theme.accent }]}>{"✕"}</Text>
        </Pressable>
        <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === "cadastrar" ? (
          <TextInput
            accessibilityLabel="Nome"
            placeholder="Nome"
            placeholderTextColor={theme.mutedText}
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
        ) : null}

        <TextInput
          accessibilityLabel="Email"
          placeholder="Email"
          placeholderTextColor={theme.mutedText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={inputStyle}
        />

        <TextInput
          accessibilityLabel="Senha"
          placeholder="Senha"
          placeholderTextColor={theme.mutedText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={inputStyle}
        />

        {mode === "cadastrar" ? (
          <TextInput
            accessibilityLabel="Confirmar senha"
            placeholder="Confirmar senha"
            placeholderTextColor={theme.mutedText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={inputStyle}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === "entrar" ? "Entrar" : "Criar conta"}
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text allowFontScaling style={styles.primaryButtonText}>
              {mode === "entrar" ? "Entrar" : "Criar conta"}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === "entrar" ? "Ir para criar conta" : "Ir para entrar"}
          style={styles.switchModeBtn}
          onPress={() => setMode(mode === "entrar" ? "cadastrar" : "entrar")}
        >
          <Text allowFontScaling style={[styles.switchModeText, { color: theme.accent }]}>
            {mode === "entrar" ? "Nao tem conta? Criar conta" : "Ja tem conta? Entrar"}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text allowFontScaling style={[styles.dividerText, { color: theme.mutedText }]}>
            ou
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar com Google"
          style={[styles.socialButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
          onPress={() => void handleGoogle()}
          disabled={submitting}
        >
          <Text allowFontScaling style={[styles.socialButtonText, { color: theme.titleText }]}>
            Continuar com Google
          </Text>
        </Pressable>

        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              settings.readingMode === "escuro"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={22}
            style={styles.appleButton}
            onPress={() => void handleApple()}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  switchModeBtn: {
    marginTop: 16,
    alignItems: "center",
    minHeight: 32,
    justifyContent: "center",
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
  },
  socialButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  appleButton: {
    height: 48,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
});
