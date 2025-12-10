

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">Welcome to ChitChat</h1>
        <p className="text-lg opacity-80">Fast, Simple and Secure Messaging.</p>
        <div className="space-x-4">
          <a href="/login" className="btn btn-primary">Login</a>
          <a href="/signup" className="btn btn-outline">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

