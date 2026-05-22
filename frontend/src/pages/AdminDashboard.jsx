function AdminDashboard() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  return (

    <div
      className="
      min-h-screen
      bg-gray-100
      p-10
      "
    >

      <h1
        className="
        text-4xl
        font-bold
        mb-8
        "
      >
        Admin Dashboard
      </h1>

      <div
        className="
        bg-white
        p-6
        rounded-2xl
        shadow-md
        "
      >

        <p>
          Welcome,
          {user?.fullname}
        </p>

        <p>
          Role:
          {user?.role}
        </p>

      </div>

    </div>
  );
}

export default AdminDashboard;