<template>
  <main class="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
    <header class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <nav class="mt-3 flex gap-2 text-sm">
        <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/students">学生列表</RouterLink>
        <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/class-overview">班级视图</RouterLink>
        <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/dashboard">教师驾驶舱</RouterLink>
        <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/admin/org-teachers">组织与账号</RouterLink>
      </nav>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
      <h1 class="mt-1 text-lg font-bold text-slate-900">管理端 / 教师端</h1>
    </header>

    <RouterView />
  </main>
</template>
