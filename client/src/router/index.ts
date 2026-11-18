import { createRouter, createWebHistory } from "vue-router";
export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: "/",
      component: () => import("@/features/home/pages/HomePage.vue"),
      meta: { title: "Clubhouse" },
    },
    {
      path: "/tournaments",
      component: () =>
        import("@/features/tournaments/pages/TournamentListPage.vue"),
      meta: { title: "Tournaments" },
    },
    {
      path: "/tournaments/:id",
      component: () =>
        import("@/features/tournaments/pages/TournamentDetailsPage.vue"),
      meta: { title: "Tournament" },
    },
    {
      path: "/teams",
      component: () => import("@/features/teams/pages/TeamListPage.vue"),
      meta: { title: "Teams" },
    },
    {
      path: "/teams/:id",
      component: () => import("@/features/teams/pages/TeamDetailsPage.vue"),
      meta: { title: "Team profile" },
    },
    {
      path: "/games",
      component: () => import("@/features/games/pages/GamesPage.vue"),
      meta: { title: "Game results" },
    },
    {
      path: "/rankings",
      component: () => import("@/features/rankings/pages/RankingsPage.vue"),
      meta: { title: "Rankings" },
    },
    {
      path: "/matchups",
      component: () => import("@/features/matchups/pages/MatchupsPage.vue"),
      meta: { title: "Matchups" },
    },
    {
      path: "/history",
      component: () => import("@/features/history/pages/HistoryPage.vue"),
      meta: { title: "Tournament history" },
    },
    {
      path: "/login",
      component: () => import("@/features/auth/pages/AuthPage.vue"),
      meta: { title: "Welcome back" },
    },
    {
      path: "/register",
      component: () => import("@/features/auth/pages/AuthPage.vue"),
      meta: { title: "Join the club" },
    },
    {
      path: "/profile",
      component: () => import("@/features/auth/pages/ProfilePage.vue"),
      meta: { title: "Your profile" },
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("@/features/home/pages/NotFoundPage.vue"),
      meta: { title: "Page not found" },
    },
  ],
});
router.afterEach((to) => {
  document.title = String(to.meta.title) + " · Stout Pickleball";
});
