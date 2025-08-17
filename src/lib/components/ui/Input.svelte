<script lang="ts">
	import { cn } from "$lib/utils";

	interface Props {
		type?: "text" | "email" | "password" | "number" | "tel" | "url";
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		id?: string;
		name?: string;
		autocomplete?: string | null;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		type = "text",
		placeholder,
		value = $bindable(""),
		disabled = false,
		required = false,
		class: className = "",
		id,
		name,
		autocomplete,
		oninput,
		onchange,
		onfocus,
		onblur,
		onkeydown,
	}: Props = $props();

	const baseClasses =
		"w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed";
</script>

<input
	{type}
	{placeholder}
	bind:value
	{disabled}
	{required}
	{id}
	{name}
	autocomplete={autocomplete as any}
	class={cn(baseClasses, className)}
	{oninput}
	{onchange}
	{onfocus}
	{onblur}
	{onkeydown}
/>
