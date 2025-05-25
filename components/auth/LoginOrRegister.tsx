import ButtonLogin from "./ButtonLogin.tsx";

interface Props {
  skipLogin?: boolean;
  skipReg?: boolean;
}

export default function LoginOrRegister({ skipLogin, skipReg }: Props) {
  return (
    <div class="login-or-register">
      {!skipReg && <a href="/register">Sign up</a>}
      {!skipLogin && <ButtonLogin />}
    </div>
  );
}
