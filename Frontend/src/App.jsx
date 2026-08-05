import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"
import { ChatProvider } from "./features/chat/chat.context.jsx"
import { ThemeProvider } from "./features/theme/theme.context.jsx"

function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <InterviewProvider>
          <ChatProvider>
            <RouterProvider router={router} />
          </ChatProvider>
        </InterviewProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
