

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <input type="email" placeholder="Email" className="input input-bordered w-full mb-3" />
        <input type="password" placeholder="Password" className="input input-bordered w-full mb-4" />

        <button className="btn btn-primary w-full">Login</button>

        <p className="text-center mt-4">
          New here? <a href="/signup" className="link link-primary">Create an account</a>
        </p>
      </div>
    </div>
  );
}
