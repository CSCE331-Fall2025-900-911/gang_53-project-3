"use client";

export default function BackButton() {
  return (
    <button
      onClick={() => {
        // Hard refresh to previous page
        window.location.href = "/";
      }}
      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
    >
      <div className="text-black">
        ← Back
      </div>
    </button>
  );
}