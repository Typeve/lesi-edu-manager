<script setup lang="ts">
import { useRouter } from "vue-router";
import { getDefaultRouteByRole, useSessionStore } from "../stores/session";

const router = useRouter();
const session = useSessionStore();

const goHome = async () => {
  if (!session.state.user) {
    await router.replace("/login");
    return;
  }

  await router.replace(getDefaultRouteByRole(session.state.user.role));
};
</script>

<template>
  <section class="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow">
    <h1 class="text-2xl font-bold text-slate-900">无权限访问</h1>
    <p class="mt-2 text-sm text-slate-600">当前账号没有该页面访问权限，请联系管理员授权。</p>

    <div class="mt-5 flex justify-center gap-2">
      <button class="rounded bg-slate-100 px-3 py-1.5 text-sm" @click="goHome">返回首页</button>
      <button class="rounded bg-brand-500 px-3 py-1.5 text-sm text-white" @click="router.push('/login')">切换账号</button>
    </div>
  </section>
</template>
