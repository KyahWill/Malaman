<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';
  import type { ContentRecommendation } from '$lib/types';

  interface Props {
    recommendation: ContentRecommendation;
    onClose: () => void;
    onSubmitted: () => void;
  }

  let { recommendation, onClose, onSubmitted }: Props = $props();

  let feedbackType = $state<string>('');
  let rating = $state<number>(0);
  let comment = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const feedbackOptions = [
    { value: 'helpful', label: 'This was helpful', icon: '👍' },
    { value: 'not_helpful', label: 'This was not helpful', icon: '👎' },
    { value: 'irrelevant', label: 'This is irrelevant to me', icon: '❌' },
    { value: 'too_easy', label: 'This is too easy for me', icon: '😴' },
    { value: 'too_hard', label: 'This is too hard for me', icon: '😰' }
  ];

  async function submitFeedback() {
    if (!feedbackType) {
      error = 'Please select a feedback type';
      return;
    }

    try {
      submitting = true;
      error = null;

      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: recommendation.contentId,
          recommendationId: recommendation.id,
          type: feedbackType,
          rating: rating || undefined,
          comment: comment.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      onSubmitted();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error submitting feedback:', err);
    } finally {
      submitting = false;
    }
  }

  function handleRatingClick(value: number) {
    rating = rating === value ? 0 : value;
  }
</script>

<Modal isOpen={true} onClose={onClose} title="Recommendation Feedback">
  <div class="space-y-6">
    <div>
      <p class="text-sm text-gray-600 mb-4">
        Help us improve our recommendations by sharing your feedback on this suggestion.
      </p>
      
      <div class="bg-gray-50 p-3 rounded-lg mb-4">
        <p class="text-sm font-medium text-gray-900">Recommended Content:</p>
        <p class="text-sm text-gray-600">Content #{recommendation.contentId.slice(0, 8)}</p>
        <p class="text-xs text-gray-500 mt-1">{recommendation.explanation}</p>
      </div>
    </div>

    <div>
      <Label class="text-sm font-medium text-gray-900 mb-3 block">
        How was this recommendation?
      </Label>
      <div class="space-y-2">
        {#each feedbackOptions as option}
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="feedbackType"
              value={option.value}
              bind:group={feedbackType}
              class="sr-only"
            />
            <div class="flex items-center gap-3 flex-1">
              <span class="text-lg">{option.icon}</span>
              <span class="text-sm text-gray-900">{option.label}</span>
            </div>
            <div class={`w-4 h-4 rounded-full border-2 ${
              feedbackType === option.value 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {#if feedbackType === option.value}
                <div class="w-2 h-2 bg-white rounded-full m-0.5"></div>
              {/if}
            </div>
          </label>
        {/each}
      </div>
    </div>

    <div>
      <Label class="text-sm font-medium text-gray-900 mb-3 block">
        Rate this recommendation (optional)
      </Label>
      <div class="flex gap-1">
        {#each [1, 2, 3, 4, 5] as star}
          <button
            type="button"
            onclick={() => handleRatingClick(star)}
            class={`w-8 h-8 text-lg transition-colors ${
              rating >= star 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            ⭐
          </button>
        {/each}
        {#if rating > 0}
          <span class="ml-2 text-sm text-gray-600">{rating} star{rating !== 1 ? 's' : ''}</span>
        {/if}
      </div>
    </div>

    <div>
      <Label for="comment" class="text-sm font-medium text-gray-900 mb-2 block">
        Additional comments (optional)
      </Label>
      <textarea
        id="comment"
        bind:value={comment}
        placeholder="Tell us more about your experience with this recommendation..."
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      ></textarea>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-3">
        <p class="text-sm text-red-600">{error}</p>
      </div>
    {/if}

    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" onclick={onClose} disabled={submitting}>
        Cancel
      </Button>
      <Button onclick={submitFeedback} disabled={submitting || !feedbackType}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  </div>
</Modal>