import ButtonLogin from "./ButtonLogin.tsx";

interface Props {
  skipReg?: boolean;
}

export default function LoginOrRegister({ skipReg }: Props) {
  return (
    <div class="login-or-register">
      <ButtonLogin />
      {!skipReg && (
        <>
          or <a href="/register">register</a>
        </>
      )}
    </div>
  );
}
