"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Story {
  id: number;
  feature_name: string;
  module: string;
  priority: string;
  story_type: string;
  description: string;
  user_story: string;
  acceptance_criteria: string;
  created_at: string;
}

export default function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await axios.get<Story[]>(
          "http://127.0.0.1:8000/api/stories"
        );

        setStories(response.data);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-lg">
        Loading stories...
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No stories found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stories.map((story) => (
        <div
          key={story.id}
          className="bg-slate-900 rounded-xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {story.feature_name}
              </h2>

              <p className="text-gray-400 mt-1">
                {story.module}
              </p>
            </div>

            <div className="text-gray-500 text-sm">
              {new Date(story.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
              {story.priority}
            </span>

            <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
              {story.story_type}
            </span>
          </div>

          <div className="mb-5">
            <h3 className="font-semibold mb-2">
              Description
            </h3>

            <p className="text-gray-300 whitespace-pre-wrap">
              {story.description}
            </p>
          </div>

          <div className="mb-5">
            <h3 className="font-semibold mb-2">
              User Story
            </h3>

            <p className="text-gray-300 whitespace-pre-wrap">
              {story.user_story}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg">
              View
            </button>

            <button className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-lg">
              Edit
            </button>

            <button className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg">
              Delete
            </button>

            <button className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg">
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}