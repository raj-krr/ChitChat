import { Button, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
        chitchat-bg
        p-4 sm:p-6 relative overflow-hidden
      "
    >
      {/* Background animate grid */}
      <div className="absolute inset-0 bg-grid opacity-20 sm:opacity-25 pointer-events-none"></div>

      {/* Glass Container */}
      <div
        className="
          w-full max-w-md sm:max-w-lg 
          rounded-2xl sm:rounded-3xl 
          p-8 sm:p-8 
          pt-10 pb-10
          backdrop-blur-2xl 
          bg-white/30 border border-white/40 
          shadow-xl
          fade-in glow-hover tilt-hover
          relative z-10

          min-h-[55vh] sm:min-h-0
          flex flex-col justify-center
        "
      >
        <div className="text-center text-gray-1000">
          {/* Title */}
          <h1
            className="
              mb-4 sm:mb-4
              text-4xl sm:text-6xl font-extrabold text-indigo-900
              drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]
            "
          >
            ChitChat
          </h1>

          {/* MOBILE SHORT TEXT */}
          <Text
            size="lg"
            className="
              mb-2 text-lg font-semibold text-gray-1000 
              sm:hidden
            "
          >
            Connect instantly with people.
          </Text>

          {/* DESKTOP LONG TEXT */}
          <Text
            size="lg"
            className="
              mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-gray-1000 
              hidden sm:block
            "
          >
            Say more with <span className="text-indigo-900">ChitChat</span>.
          </Text>

          {/* MOBILE SMALL DESCRIPTION */}
          <Text
            size="sm"
            className="
              mb-8 max-w-xs mx-auto text-gray-1000 leading-relaxed 
              sm:hidden opacity-90
            "
          >
            Fast, modern & beautiful.
          </Text>

          {/* DESKTOP FULL DESCRIPTION */}
          <Text
            size="md"
            className="
              mb-10 
              max-w-sm sm:max-w-md mx-auto 
              text-gray-1000 opacity-100 leading-relaxed
              text-sm sm:text-base 
              hidden sm:block
            "
          >
            A fast, modern messaging experience designed for people who want to
            connect instantly, seamlessly, and beautifully.
          </Text>

          {/* BUTTON GROUP */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            <Button
              size="md"
              radius="lg"
              fullWidth
              color="indigo"
              className="
                text-base sm:text-lg
                transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1 
                transform-gpu
              "
              onClick={() => navigate("/login")}
            >
              Login
            </Button>

            <Button
              size="md"
              radius="lg"
              fullWidth
              variant="outline"
              color="indigo"
              className="
                border-2 text-base sm:text-lg
                transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1 
                transform-gpu
              "
              onClick={() => navigate("/register")}
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
