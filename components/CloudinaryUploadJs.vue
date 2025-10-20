<template>
	<div class="flex justify-center items-center w-full">
		<label v-if="imageUrl" class="relative w-full rounded-lg cursor-pointer">
			<img
				:src="imageUrl"
				alt=""
				class="object-cover w-full h-full max-h-48 rounded-lg"
			/>
			<input
				@change="uploadImage"
				type="file"
				accept=".jpeg,.jpg,.png,image/jpeg,image/png"
				class="sr-only"
			/>
			<div
				class="absolute bottom-2 left-1/2 px-2 py-1 w-full text-xs text-center text-white rounded -translate-x-1/2 bg-black/70"
			>
				click to change
			</div>
		</label>
		<label
			v-else
			class="flex flex-col justify-center items-center w-full h-full rounded border-2 border-gray-300 border-dashed transition-colors cursor-pointer hover:bg-gray-200"
			:class="[
				isUploading
					? 'pointer-events-none bg-gray-700 animate-pulse text-white'
					: '',
			]"
		>
			<div class="flex flex-col justify-center items-center">
				<svg
					class="mx-auto w-12 h-12 text-gray-400"
					stroke="currentColor"
					fill="none"
					viewBox="0 0 48 48"
					aria-hidden="true"
				>
					<path
						d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<p
					class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600"
				>
					{{ addImageBtnText }}
				</p>
			</div>
			<input
				@change="uploadImage"
				multiple
				type="file"
				accept=".jpeg,.jpg,.png,image/jpeg,image/png"
				class="sr-only"
			/>
		</label>
	</div>
</template>

<script setup>
	const emit = defineEmits(["uploaded"]);
	const props = defineProps(["image"]);
	const addImageBtnText = ref("Add Image");
	const isUploading = ref(false);

	const imageUrl = ref(props.image);

	const config = useRuntimeConfig();

	const uploadImage = async (event) => {
		isUploading.value = true;
		addImageBtnText.value = "Uploading...";

		let files = event.target.files;

		let formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			console.log(files[i]);
			formData.append("file", files[i]);
			formData.append("upload_preset", config.public.CLOUDINARY_UPLOAD_PRESET);
			formData.append("folder", "anjanarai");

			const response = await fetch(
				`https://api.cloudinary.com/v1_1/tinkrshop/image/upload`,
				{
					method: "POST",
					body: formData,
				}
			);
			const res = await response.json();
			let imgDetails = getImageDetails(res);
			console.log("imgDetails", imgDetails);

			emit("uploaded", [imgDetails]);
		}

		isUploading.value = false;
		addImageBtnText.value = "Add Image";
	};

	const getImageDetails = (val) => {
		const data = {
			secure_url: val.secure_url,
			height: val.height,
			width: val.width,
			bytes: val.bytes,
			colors: val.colors.map(([hexValue]) => hexValue),
			created_at: val.created_at,
		};

		// console.log(data);
		return data;
	};
</script>
