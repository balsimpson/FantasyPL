import { useCanonicalUrl } from "./useCanonicalUrl";
import { useSavedManagers } from "./useSavedManagers";

export type CalendarPreviewEntry = { uid: string; title: string; start: string; players?: string[]; location?: string };

type CalendarPreview = {
  name: string;
  events: CalendarPreviewEntry[];
};

export type CalendarTeam = { id: string; teamName: string };

const calendarTypes = [
  { label: "Team calendar", value: "team" },
  { label: "Deadlines only", value: "deadlines" },
];

export function useManagerCalendarSubscription(deadlineUrl: () => string, initialTeam?: CalendarTeam) {
  const { savedManagers } = useSavedManagers();
  const calendarType = ref("team");
  const selectedTeam = ref(initialTeam?.id ?? "manual");
  const enteredId = ref("");
  const preview = ref<CalendarPreview | null>(null);
  const loading = ref(false);
  const previewError = ref("");
  let request: AbortController | undefined;

  const teams = computed(() => {
    const saved = savedManagers.value.filter((team) => team.id !== initialTeam?.id);
    const available = initialTeam ? [initialTeam, ...saved] : saved;
    return [
      ...available.map((team) => ({ label: `${team.teamName} · ${team.id}`, value: team.id })),
      { label: "Enter a Manager ID", value: "manual" },
    ];
  });
  const managerId = computed(() => selectedTeam.value === "manual"
    ? enteredId.value.trim().replace(/^0+(?=\d)/, "")
    : selectedTeam.value);
  const validManagerId = computed(() =>
    /^[1-9]\d*$/.test(managerId.value) && Number.isSafeInteger(Number(managerId.value)));
  const showPreview = computed(() => calendarType.value === "team" && validManagerId.value);
  const idError = computed(() => enteredId.value.trim() && !validManagerId.value ? "Enter a valid Manager ID." : "");
  const managerUrl = useCanonicalUrl(() => `/calendar/managers/${managerId.value}/team.ics`);
  const subscriptionUrl = computed(() => calendarType.value === "deadlines"
    ? deadlineUrl()
    : validManagerId.value && (selectedTeam.value !== "manual" || preview.value) ? managerUrl.value : null);

  watch([calendarType, selectedTeam, managerId], (_, __, onCleanup) => {
    preview.value = null;
    loading.value = false;
    previewError.value = "";
    if (!showPreview.value) return;

    const timer = setTimeout(loadPreview, selectedTeam.value === "manual" ? 350 : 0);
    onCleanup(() => {
      clearTimeout(timer);
      request?.abort();
    });
  }, { immediate: true });

  async function loadPreview() {
    if (loading.value || !showPreview.value) return;
    const id = managerId.value;

    const controller = new AbortController();
    request = controller;
    loading.value = true;
    previewError.value = "";
    try {
      const result = await $fetch<CalendarPreview>(`/api/managers/${id}/calendar`, {
        signal: controller.signal,
        retry: 0,
      });
      if (!controller.signal.aborted) preview.value = result;
    } catch (error) {
      if (!controller.signal.aborted) {
        const status = (error as { statusCode?: number }).statusCode;
        previewError.value = status === 404 ? "Manager not found." : "Could not load the calendar. Try again.";
      }
    } finally {
      if (request === controller) {
        request = undefined;
        loading.value = false;
      }
    }
  }

  return {
    calendarTypes, calendarType, selectedTeam, teams, enteredId,
    preview, showPreview, idError, previewError, subscriptionUrl, loadPreview,
  };
}
