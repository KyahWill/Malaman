<script lang="ts">
  import { onMount } from "svelte";
  import {
    Button,
    Card,
    Input,
    Label,
    Modal,
  } from "$lib/components/ui/index.js";
  import {
    Settings,
    Target,
    Clock,
    BookOpen,
    Save,
    RefreshCw,
  } from "lucide-svelte";

  export let studentId: string;

  let settings = {
    targetSkills: [] as string[],
    timeConstraints: {
      hoursPerWeek: 5,
      targetCompletionDate: "",
    },
    learningPreferences: {
      preferredPace: "medium" as "slow" | "medium" | "fast",
      preferredMediaTypes: [] as string[],
      learningStyle: "mixed" as "visual" | "auditory" | "kinesthetic" | "mixed",
    },
  };

  let newSkill = "";
  let loading = false;
  let saving = false;
  let error = "";
  let success = "";
  let showRegenerateModal = false;

  const mediaTypeOptions = [
    { value: "rich_text", label: "Text Content" },
    { value: "video", label: "Videos" },
    { value: "image", label: "Images & Diagrams" },
    { value: "file", label: "Documents & Files" },
    { value: "youtube", label: "YouTube Videos" },
  ];

  onMount(async () => {
    await loadSettings();
  });

  async function loadSettings() {
    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/profile/${studentId}/learning-preferences`,
      );
      const result = await response.json();

      if (response.ok && result.preferences) {
        settings.learningPreferences = {
          ...settings.learningPreferences,
          ...result.preferences,
        };
      }

      // Load any existing roadmap settings
      const roadmapResponse = await fetch(`/api/roadmap/${studentId}`);
      const roadmapResult = await roadmapResponse.json();

      if (roadmapResponse.ok && roadmapResult.roadmap) {
        const factors =
          roadmapResult.roadmap.roadmap_data.personalization_factors;
        if (factors.target_skills) {
          settings.targetSkills = factors.target_skills;
        }
        if (factors.time_constraints) {
          settings.timeConstraints = {
            ...settings.timeConstraints,
            ...factors.time_constraints,
          };
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      error = "Failed to load learning preferences";
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    try {
      saving = true;
      error = "";
      success = "";

      // Save learning preferences to profile
      const preferencesResponse = await fetch(
        `/api/profile/${studentId}/learning-preferences`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learningPreferences: settings.learningPreferences,
          }),
        },
      );

      if (!preferencesResponse.ok) {
        const result = await preferencesResponse.json();
        throw new Error(result.error || "Failed to save preferences");
      }

      success = "Learning preferences saved successfully!";
      setTimeout(() => (success = ""), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      error = err instanceof Error ? err.message : "Failed to save settings";
    } finally {
      saving = false;
    }
  }

  async function regenerateRoadmap() {
    try {
      saving = true;
      error = "";

      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          targetSkills:
            settings.targetSkills.length > 0
              ? settings.targetSkills
              : undefined,
          timeConstraints:
            settings.timeConstraints.hoursPerWeek > 0
              ? settings.timeConstraints
              : undefined,
          forceRegenerate: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to regenerate roadmap");
      }

      success = "Roadmap regenerated successfully with your new preferences!";
      showRegenerateModal = false;
      setTimeout(() => (success = ""), 5000);
    } catch (err) {
      console.error("Failed to regenerate roadmap:", err);
      error =
        err instanceof Error ? err.message : "Failed to regenerate roadmap";
    } finally {
      saving = false;
    }
  }

  function addSkill() {
    if (newSkill.trim() && !settings.targetSkills.includes(newSkill.trim())) {
      settings.targetSkills = [...settings.targetSkills, newSkill.trim()];
      newSkill = "";
    }
  }

  function removeSkill(skill: string) {
    settings.targetSkills = settings.targetSkills.filter((s) => s !== skill);
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      addSkill();
    }
  }

  function toggleMediaType(mediaType: string) {
    const index =
      settings.learningPreferences.preferredMediaTypes.indexOf(mediaType);
    if (index > -1) {
      settings.learningPreferences.preferredMediaTypes =
        settings.learningPreferences.preferredMediaTypes.filter(
          (type) => type !== mediaType,
        );
    } else {
      settings.learningPreferences.preferredMediaTypes = [
        ...settings.learningPreferences.preferredMediaTypes,
        mediaType,
      ];
    }
  }

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 flex items-center">
        <Settings class="h-6 w-6 mr-2" />
        Roadmap Settings
      </h2>
      <p class="text-gray-600">
        Customize your learning preferences to get a more personalized roadmap
      </p>
    </div>
  </div>

  {#if error}
    <Card class="p-4 border-red-200 bg-red-50">
      <p class="text-red-700">{error}</p>
    </Card>
  {/if}

  {#if success}
    <Card class="p-4 border-green-200 bg-green-50">
      <p class="text-green-700">{success}</p>
    </Card>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <span class="ml-3 text-gray-600">Loading your preferences...</span>
    </div>
  {:else}
    <!-- Target Skills -->
    <Card class="p-6">
      <div class="flex items-center mb-4">
        <Target class="h-5 w-5 text-blue-600 mr-2" />
        <h3 class="text-lg font-medium text-gray-900">Target Skills</h3>
      </div>
      <p class="text-gray-600 mb-4">
        What specific skills or topics would you like to focus on in your
        learning journey?
      </p>

      <div class="space-y-4">
        <div class="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter a skill or topic..."
            bind:value={newSkill}
            onkeydown={handleKeyPress}
            class="flex-1"
          />
          <Button onclick={addSkill} disabled={!newSkill.trim()}>Add</Button>
        </div>

        {#if settings.targetSkills.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each settings.targetSkills as skill}
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  type="button"
                  class="ml-2 text-blue-600 hover:text-blue-800"
                  on:click={() => removeSkill(skill)}
                >
                  ×
                </button>
              </span>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500 text-sm italic">No target skills specified</p>
        {/if}
      </div>
    </Card>

    <!-- Time Constraints -->
    <Card class="p-6">
      <div class="flex items-center mb-4">
        <Clock class="h-5 w-5 text-green-600 mr-2" />
        <h3 class="text-lg font-medium text-gray-900">Time Constraints</h3>
      </div>
      <p class="text-gray-600 mb-4">
        Help us create a realistic timeline for your learning goals.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label for="hoursPerWeek">Hours per week</Label>
          <Input
            id="hoursPerWeek"
            type="number"
            min="1"
            max="40"
            bind:value={settings.timeConstraints.hoursPerWeek}
            class="mt-1"
          />
          <p class="text-sm text-gray-500 mt-1">
            How many hours can you dedicate to learning each week?
          </p>
        </div>

        <div>
          <Label for="targetDate">Target completion date (optional)</Label>
          <Input
            id="targetDate"
            type="date"
            min={minDate}
            bind:value={settings.timeConstraints.targetCompletionDate}
            class="mt-1"
          />
          <p class="text-sm text-gray-500 mt-1">
            When would you like to complete your learning goals?
          </p>
        </div>
      </div>
    </Card>

    <!-- Learning Preferences -->
    <Card class="p-6">
      <div class="flex items-center mb-4">
        <BookOpen class="h-5 w-5 text-purple-600 mr-2" />
        <h3 class="text-lg font-medium text-gray-900">Learning Preferences</h3>
      </div>
      <p class="text-gray-600 mb-6">
        Tell us about your preferred learning style and content types.
      </p>

      <div class="space-y-6">
        <!-- Learning Pace -->
        <div>
          <Label class="text-base font-medium">Preferred Learning Pace</Label>
          <div class="mt-2 space-y-2">
            {#each [{ value: "slow", label: "Slow & Steady", desc: "Take time to thoroughly understand each concept" }, { value: "medium", label: "Moderate", desc: "Balanced approach with regular progress" }, { value: "fast", label: "Fast Track", desc: "Quick progression through material" }] as option}
              <label
                class="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50
                            {settings.learningPreferences.preferredPace ===
                option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'}"
              >
                <input
                  type="radio"
                  name="pace"
                  value={option.value}
                  bind:group={settings.learningPreferences.preferredPace}
                  class="mt-1"
                />
                <div>
                  <div class="font-medium text-gray-900">{option.label}</div>
                  <div class="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Learning Style -->
        <div>
          <Label class="text-base font-medium">Learning Style</Label>
          <div class="mt-2 space-y-2">
            {#each [{ value: "visual", label: "Visual", desc: "Learn best through images, diagrams, and visual content" }, { value: "auditory", label: "Auditory", desc: "Prefer listening to explanations and discussions" }, { value: "kinesthetic", label: "Hands-on", desc: "Learn by doing and practical exercises" }, { value: "mixed", label: "Mixed", desc: "Combination of different learning approaches" }] as option}
              <label
                class="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50
                            {settings.learningPreferences.learningStyle ===
                option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'}"
              >
                <input
                  type="radio"
                  name="style"
                  value={option.value}
                  bind:group={settings.learningPreferences.learningStyle}
                  class="mt-1"
                />
                <div>
                  <div class="font-medium text-gray-900">{option.label}</div>
                  <div class="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Preferred Media Types -->
        <div>
          <Label class="text-base font-medium">Preferred Content Types</Label>
          <p class="text-sm text-gray-600 mb-3">
            Select the types of content you prefer (multiple selections allowed)
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            {#each mediaTypeOptions as option}
              <label
                class="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50
                            {settings.learningPreferences.preferredMediaTypes.includes(
                  option.value,
                )
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'}"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={settings.learningPreferences.preferredMediaTypes.includes(
                    option.value,
                  )}
                  on:change={() => toggleMediaType(option.value)}
                />
                <span class="font-medium text-gray-900">{option.label}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>
    </Card>

    <!-- Actions -->
    <div class="flex justify-between">
      <Button variant="outline" onclick={() => (showRegenerateModal = true)}>
        <RefreshCw class="h-4 w-4 mr-2" />
        Regenerate Roadmap
      </Button>

      <Button onclick={saveSettings} disabled={saving}>
        <Save class="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  {/if}
</div>

<!-- Regenerate Roadmap Confirmation Modal -->
<Modal bind:open={showRegenerateModal} title="Regenerate Roadmap">
  <div class="space-y-4">
    <p class="text-gray-700">
      This will create a new personalized roadmap based on your current
      preferences and learning progress. Your existing roadmap will be replaced.
    </p>

    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Important</h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>
              Make sure to save your preferences first if you've made changes.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <Button variant="outline" onclick={() => (showRegenerateModal = false)}>
        Cancel
      </Button>
      <Button onclick={regenerateRoadmap} disabled={saving}>
        {saving ? "Generating..." : "Regenerate Roadmap"}
      </Button>
    </div>
  </div>
</Modal>
