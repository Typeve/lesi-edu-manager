<script setup lang="ts">
import { computed } from "vue";
import { getDefaultRouteByRole, useSessionStore } from "../stores/session";

const session = useSessionStore();
const homePath = computed(() => (session.state.user ? getDefaultRouteByRole(session.state.user.role) : "/login"));
</script>

<template>
  <section class="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow">
    <h1 class="text-2xl font-bold text-slate-900">无权限访问</h1>
    <p class="mt-2 text-sm text-slate-600">当前账号没有该页面访问权限，请联系管理员授权。</p>

    <div class="mt-5 flex justify-center gap-2">
      <RouterLink :to="homePath" class="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-900">返回首页</RouterLink>
      <RouterLink
        to="/login"
        class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        切换账号
      </RouterLink>
    </div>
  </section>
</template>
