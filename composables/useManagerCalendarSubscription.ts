import { useCanonicalUrl } from "./useCanonicalUrl";
import { useSavedManagers } from "./useSavedManagers";

type CalendarPreview = {
  name: string;
  events: { uid: string; title: string; start: string }[];
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
  const includeStartingXI = ref(false);
  const preview = ref<CalendarPreview | null>(null);
  const loading = ref(false);
  const idError = ref("");
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
  const options = computed(() => includeStartingXI.value ? "?xi=1" : "");
  const managerUrl = useCanonicalUrl(() => `/calendar/managers/${managerId.value}/team.ics${options.value}`);
  const subscriptionUrl = computed(() => calendarType.value === "deadlines"
    ? deadlineUrl()
    : preview.value ? managerUrl.value : null);

  watch([calendarType, selectedTeam, enteredId, includeStartingXI], () => {
    request?.abort();
    preview.value = null;
    loading.value = false;
    idError.value = "";
    previewError.value = "";
  }, { flush: "sync" });
  onBeforeUnmount(() => request?.abort());

  async function loadPreview() {
    if (loading.value) return;
    const id = managerId.value;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      idError.value = "Enter a valid Manager ID.";
      return;
    }

    const controller = new AbortController();
    request = controller;
    loading.value = true;
    previewError.value = "";
    try {
      const result = await $fetch<CalendarPreview>(`/api/managers/${id}/calendar${options.value}`, {
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
    calendarTypes, calendarType, selectedTeam, teams, enteredId, includeStartingXI,
    preview, loading, idError, previewError, subscriptionUrl, loadPreview,
  };
}
