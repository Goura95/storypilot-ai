"use client";

import { useState, type ChangeEvent } from "react";
import {
  approveStoryReview,
  generateStory,
  type StoryResponse,
} from "@/services/storyService";
import { RateLimitError, ApiError, UnauthorizedError } from "@/services/api";

import StoryOutput from "./StoryOutput";

export default function StoryForm() {
  // ============================================================
  // FORM STATE
  // ============================================================

  const [featureName, setFeatureName] = useState("");
  const [module, setModule] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [storyType, setStoryType] = useState("Feature");
  const [description, setDescription] = useState("");

  // ============================================================
  // IMAGE STATE
  // ============================================================

  const [requirementImage, setRequirementImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  // ============================================================
  // STORY STATE
  // ============================================================

  const [storyResult, setStoryResult] =
    useState<StoryResponse | null>(null);

  const [approvingReview, setApprovingReview] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // IMAGE CHANGE
  // ============================================================

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please upload a PNG, JPG, JPEG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10 MB.");

      event.target.value = "";
      return;
    }

    // Remove previous preview if one exists
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setRequirementImage(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ============================================================
  // REMOVE IMAGE
  // ============================================================

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setRequirementImage(null);
    setImagePreview(null);
  };

  // ============================================================
  // GENERATE STORY
  // ============================================================

  const handleGenerate = async () => {
    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!featureName.trim()) {
      alert("Please enter Feature Name.");
      return;
    }

    if (!module.trim()) {
      alert("Please enter Module.");
      return;
    }

    if (!description.trim() && !requirementImage) {
      alert(
        "Please enter a requirement description or upload a requirement image."
      );

      return;
    }

    // ----------------------------------------------------------
    // START LOADING
    // ----------------------------------------------------------

    setLoading(true);

    // Clear previous result and error
    setStoryResult(null);
    setError(null);

    try {
      // --------------------------------------------------------
      // CREATE FORMDATA
      // --------------------------------------------------------

      const formData = new FormData();

      formData.append(
        "feature_name",
        featureName.trim()
      );

      formData.append(
        "module",
        module.trim()
      );

      formData.append(
        "priority",
        priority
      );

      formData.append(
        "story_type",
        storyType
      );

      formData.append(
        "description",
        description.trim()
      );

      // --------------------------------------------------------
      // IMAGE
      // --------------------------------------------------------

      if (requirementImage) {
        formData.append(
          "requirement_image",
          requirementImage
        );
      }

      // --------------------------------------------------------
      // CALL BACKEND
      // --------------------------------------------------------

      const result: StoryResponse =
        await generateStory(formData);

      console.log(
        "Generated Story:",
        result
      );

      // --------------------------------------------------------
      // STORE RESULT
      // --------------------------------------------------------

      setStoryResult(result);
    } catch (error) {
      console.error(
        "Story generation error:",
        error
      );

      let errorMessage = "Failed to generate story. Please try again.";

      if (error instanceof RateLimitError) {
        errorMessage = "API rate limit exceeded. Please try again in a few minutes.";
      } else if (error instanceof UnauthorizedError) {
        errorMessage = "Your session has expired. Please login again.";
        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (error instanceof ApiError) {
        errorMessage = error.detail || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async () => {
    if (!storyResult || storyResult.approved_for_final_output) {
      return;
    }

    try {
      setApprovingReview(true);
      setError("");
      const updatedStory = await approveStoryReview(storyResult.id);
      setStoryResult(updatedStory);
    } catch (approveError) {
      console.error("Story review approval error:", approveError);
      setError("Unable to approve the story review. Please try again.");
    } finally {
      setApprovingReview(false);
    }
  };

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* INPUT CARD */}
      {/* ====================================================== */}

      <div
        className="
          rounded-3xl
          border border-white/10
          bg-slate-900/70
          p-6
          shadow-2xl
          lg:p-8
        "
      >
        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-indigo-400
              "
            >
              AI Story Generator
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            Create a User Story
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Describe your requirement or upload a
            requirement screenshot. StoryPilot AI will
            generate the user story, acceptance criteria
            and detailed QA test cases.
          </p>
        </div>

        {/* ==================================================== */}
        {/* ERROR ALERT */}
        {/* ==================================================== */}

        {error && (
          <div
            className="
              mb-6
              rounded-lg
              border border-red-500/30
              bg-red-500/10
              p-4
            "
          >
            <div className="flex items-start gap-3">
              <span className="text-red-400">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-400">
                  Error
                </p>
                <p className="mt-1 text-sm text-red-300">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                className="
                  ml-auto
                  text-red-400
                  hover:text-red-300
                "
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* FEATURE NAME */}
        {/* ==================================================== */}

        <div className="mb-6">
          <label
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-200
            "
          >
            Feature Name
          </label>

          <input
            type="text"
            value={featureName}
            onChange={(event) =>
              setFeatureName(event.target.value)
            }
            placeholder="Example: Login with MFA"
            className="
              w-full
              rounded-xl
              border border-slate-700
              bg-slate-800/80
              px-4
              py-3
              text-white
              outline-none
              transition
              placeholder:text-slate-500
              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20
            "
          />
        </div>

        {/* ==================================================== */}
        {/* MODULE */}
        {/* ==================================================== */}

        <div className="mb-6">
          <label
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-200
            "
          >
            Module
          </label>

          <input
            type="text"
            value={module}
            onChange={(event) =>
              setModule(event.target.value)
            }
            placeholder="Example: Authentication"
            className="
              w-full
              rounded-xl
              border border-slate-700
              bg-slate-800/80
              px-4
              py-3
              text-white
              outline-none
              transition
              placeholder:text-slate-500
              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20
            "
          />
        </div>

        {/* ==================================================== */}
        {/* PRIORITY + STORY TYPE */}
        {/* ==================================================== */}

        <div className="grid gap-6 md:grid-cols-2">
          {/* PRIORITY */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-200
              "
            >
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="
                w-full
                rounded-xl
                border border-slate-700
                bg-slate-800/80
                px-4
                py-3
                text-white
                outline-none
                focus:border-indigo-500
              "
            >
              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

              <option value="Critical">
                Critical
              </option>
            </select>
          </div>

          {/* STORY TYPE */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-200
              "
            >
              Story Type
            </label>

            <select
              value={storyType}
              onChange={(event) =>
                setStoryType(event.target.value)
              }
              className="
                w-full
                rounded-xl
                border border-slate-700
                bg-slate-800/80
                px-4
                py-3
                text-white
                outline-none
                focus:border-indigo-500
              "
            >
              <option value="Feature">
                Feature
              </option>

              <option value="Enhancement">
                Enhancement
              </option>

              <option value="Bug">
                Bug
              </option>

              <option value="Task">
                Task
              </option>
            </select>
          </div>
        </div>

        {/* ==================================================== */}
        {/* DESCRIPTION */}
        {/* ==================================================== */}

        <div className="mt-6">
          <div
            className="
              mb-2
              flex
              items-center
              justify-between
            "
          >
            <label
              className="
                block
                text-sm
                font-medium
                text-slate-200
              "
            >
              Requirement Description
            </label>

            <span className="text-xs text-slate-500">
              Manual Input
            </span>
          </div>

          <textarea
            rows={7}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="
              Describe what the feature should do,
              who should use it, expected behavior,
              validations, business rules, etc.
            "
            className="
              w-full
              resize-y
              rounded-xl
              border border-slate-700
              bg-slate-800/80
              px-4
              py-3
              text-white
              outline-none
              transition
              placeholder:text-slate-500
              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20
            "
          />
        </div>

        {/* ==================================================== */}
        {/* IMAGE UPLOAD */}
        {/* ==================================================== */}

        <div className="mt-8">
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-white
                "
              >
                Requirement Image
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Upload a screenshot, UI design,
                document or requirement image.
              </p>
            </div>

            <span
              className="
                rounded-full
                border border-purple-400/20
                bg-purple-500/10
                px-3
                py-1
                text-xs
                text-purple-300
              "
            >
              🖼 Optional
            </span>
          </div>

          {/* ================================================== */}
          {/* NO IMAGE */}
          {/* ================================================== */}

          {!imagePreview ? (
            <label
              className="
                flex
                cursor-pointer
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-indigo-400/30
                bg-slate-800/40
                px-6
                py-12
                transition
                hover:border-indigo-400/60
                hover:bg-indigo-500/5
              "
            >
              <div
                className="
                  mb-4
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-indigo-500
                  to-purple-600
                  text-2xl
                "
              >
                🖼️
              </div>

              <p className="text-base font-semibold text-white">
                Upload Requirement Image
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Click to browse from your computer
              </p>

              <p className="mt-2 text-xs text-slate-600">
                PNG, JPG, JPEG, WEBP • Maximum 10 MB
              </p>

              <input
                type="file"
                accept="
                  image/png,
                  image/jpeg,
                  image/jpg,
                  image/webp
                "
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            /* ================================================== */
            /* IMAGE PREVIEW */
            /* ================================================== */

            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-indigo-400/20
                bg-slate-950
                p-4
              "
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src={imagePreview}
  alt="Requirement preview"
  className="max-h-96 w-full rounded-xl object-contain"
/>

              <button
                type="button"
                onClick={removeImage}
                className="
                  absolute
                  right-6
                  top-6
                  rounded-lg
                  border
                  border-red-400/20
                  bg-red-500/80
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-white
                  hover:bg-red-500
                "
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* GENERATE BUTTON */}
        {/* ==================================================== */}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="
            mt-8
            flex
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-purple-600
            px-6
            py-4
            text-base
            font-bold
            text-white
            shadow-lg
            shadow-indigo-950/30
            transition
            hover:scale-[1.01]
            hover:shadow-indigo-500/20
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {loading ? (
            <>
              <span className="animate-spin">
                ◌
              </span>

              Generating Story...
            </>
          ) : (
            <>
              ✨

              Generate Story
            </>
          )}
        </button>

        {/* ==================================================== */}
        {/* FEATURES */}
        {/* ==================================================== */}

        <div
          className="
            mt-4
            flex
            flex-wrap
            justify-center
            gap-5
            text-xs
          "
        >
          <span className="text-green-400">
            ✓ AI Generated
          </span>

          <span className="text-blue-400">
            ✓ Azure DevOps Ready
          </span>

          <span className="text-purple-400">
            ✓ Smart Test Cases
          </span>

          <span className="text-cyan-400">
            ✓ Image Understanding
          </span>
        </div>
      </div>

      {/* ====================================================== */}
      {/* OUTPUT */}
      {/* ====================================================== */}

      {storyResult !== null && (
        <StoryOutput
          storyResult={storyResult}
          onApproveReview={handleApproveReview}
          approvingReview={approvingReview}
        />
      )}
    </div>
  );
}
