import ButtonLogin from "./ButtonLogin.tsx";

interface Props {
  skipLogin?: boolean;
  skipReg?: boolean;
}

export default function LoginOrRegister({ skipLogin, skipReg }: Props) {
  return (
    <div class="login-or-register">
      {!skipLogin && <ButtonLogin />}
      {!skipLogin && !skipReg && " or "}
      {!skipReg && <a href="/register">register</a>}
    </div>
  );
}
