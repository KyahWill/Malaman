<script lang="ts">
  import { onMount } from 'svelte';
  import type { PersonalizedRoadmap } from '$lib/services/roadmapService.js';
  import { Button, Card, Badge, Modal, Input, Label } from '$lib/components/ui/index.js';
  import { Users, TrendingUp, Clock, Target, Search, Filter, Eye, RefreshCw } from 'lucide-svelte';

  export let courseId: string;

  let studentRoadmaps: Array<{
    student: any;
    roadmap: PersonalizedRoadmap | null;
    progress: number;
  }> = [];
  let loading = true;
  let error = '';
  let searchTerm = '';
  let selectedStudent: any = null;
  let showStudentModal = false;
  let filterStatus: 'all' | 'active' | 'completed' | 'paused' = 'all';

  onMount(async () => {
    await loadStudentRoadmaps();
  });

  async function loadStudentRoadmaps() {
    try {
      loading = true;
      error = '';
      
      // Get enrolled students for the course
      const studentsResponse = await fetch(`/api/courses/${courseId}/students`);
      const studentsResult = await studentsResponse.json();
      
      if (!studentsResponse.ok) {
        throw new Error(studentsResult.error || 'Failed to load students');
      }

      // Get roadmaps for each student
      const roadmapPromises = studentsResult.students.map(async (student: any) => {
        try {
          const roadmapResponse = await fetch(`/api/roadmap/${student.id}`);
          const roadmapResult = await roadmapResponse.json();
          
          let progress = 0;
          if (roadmapResult.roadmap?.roadmap_data.learning_path) {
            const completed = roadmapResult.roadmap.roadmap_data.learning_path.filter(
              (item: any) => item.completion_status === 'completed'
            ).length;
            progress = Math.round((completed / roadmapResult.roadmap.roadmap_data.learning_path.length) * 100);
          }
          
          return {
            student,
            roadmap: roadmapResult.roadmap,
            progress
          };
        } catch (err) {
          console.error(`Failed to load roadmap for student ${student.id}:`, err);
          return {
            student,
            roadmap: null,
            progress: 0
          };
        }
      });

      studentRoadmaps = await Promise.all(roadmapPromises);
    } catch (err) {
      console.error('Failed to load student roadmaps:', err);
      error = err instanceof Error ? err.message : 'Failed to load student roadmaps';
    } finally {
      loading = false;
    }
  }

  async function generateRoadmapForStudent(studentId: string) {
    try {
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId,
          forceRegenerate: true 
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate roadmap');
      }
      
      // Refresh the roadmaps list
      await loadStudentRoadmaps();
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
      error = err instanceof Error ? err.message : 'Failed to generate roadmap';
    }
  }

  function viewStudentRoadmap(studentData: any) {
    selectedStudent = studentData;
    showStudentModal = true;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  $: filteredRoadmaps = studentRoadmaps.filter(item => {
    const matchesSearch = !searchTerm || 
      item.student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && item.roadmap?.status === 'active') ||
      (filterStatus === 'completed' && item.roadmap?.status === 'completed') ||
      (filterStatus === 'paused' && item.roadmap?.status === 'paused');
    
    return matchesSearch && matchesFilter;
  });

  $: roadmapStats = {
    total: studentRoadmaps.length,
    active: studentRoadmaps.filter(item => item.roadmap?.status === 'active').length,
    completed: studentRoadmaps.filter(item => item.roadmap?.status === 'completed').length,
    noRoadmap: studentRoadmaps.filter(item => !item.roadmap).length,
    averageProgress: studentRoadmaps.length > 0 
      ? Math.round(studentRoadmaps.reduce((sum, item) => sum + item.progress, 0) / studentRoadmaps.length)
      : 0
  };
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Student Roadmaps</h2>
      <p class="text-gray-600">Monitor and manage personalized learning paths</p>
    </div>
    <Button on:click={loadStudentRoadmaps} disabled={loading}>
      <RefreshCw class="h-4 w-4 mr-2 {loading ? 'animate-spin' : ''}" />
      Refresh
    </Button>
  </div>

  {#if error}
    <Card class="p-4 border-red-200 bg-red-50">
      <p class="text-red-700">{error}</p>
    </Card>
  {/if}

  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card class="p-4">
      <div class="flex items-center space-x-3">
        <Users class="h-8 w-8 text-blue-600" />
        <div>
          <div class="text-2xl font-bold text-gray-900">{roadmapStats.total}</div>
          <div class="text-sm text-gray-600">Total Students</div>
        </div>
      </div>
    </Card>
    
    <Card class="p-4">
      <div class="flex items-center space-x-3">
        <TrendingUp class="h-8 w-8 text-green-600" />
        <div>
          <div class="text-2xl font-bold text-gray-900">{roadmapStats.active}</div>
          <div class="text-sm text-gray-600">Active Roadmaps</div>
        </div>
      </div>
    </Card>
    
    <Card class="p-4">
      <div class="flex items-center space-x-3">
        <Target class="h-8 w-8 text-purple-600" />
        <div>
          <div class="text-2xl font-bold text-gray-900">{roadmapStats.averageProgress}%</div>
          <div class="text-sm text-gray-600">Avg Progress</div>
        </div>
      </div>
    </Card>
    
    <Card class="p-4">
      <div class="flex items-center space-x-3">
        <Clock class="h-8 w-8 text-orange-600" />
        <div>
          <div class="text-2xl font-bold text-gray-900">{roadmapStats.noRoadmap}</div>
          <div class="text-sm text-gray-600">No Roadmap</div>
        </div>
      </div>
    </Card>
  </div>

  <!-- Filters and Search -->
  <Card class="p-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <Label for="search">Search Students</Label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Search by name or email..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>
      </div>
      
      <div>
        <Label for="filter">Filter by Status</Label>
        <select
          id="filter"
          bind:value={filterStatus}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">All Students</option>
          <option value="active">Active Roadmaps</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </div>
    </div>
  </Card>

  <!-- Student Roadmaps List -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading student roadmaps...</span>
    </div>
  {:else if filteredRoadmaps.length === 0}
    <Card class="p-8 text-center">
      <Users class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
      <p class="text-gray-600">
        {searchTerm || filterStatus !== 'all' 
          ? 'No students match your current filters.' 
          : 'No students are enrolled in this course yet.'}
      </p>
    </Card>
  {:else}
    <div class="space-y-4">
      {#each filteredRoadmaps as item}
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span class="text-lg font-medium text-gray-600">
                  {item.student.first_name?.[0] || item.student.email[0].toUpperCase()}
                </span>
              </div>
              
              <div>
                <h4 class="font-medium text-gray-900">
                  {item.student.first_name} {item.student.last_name}
                </h4>
                <p class="text-sm text-gray-600">{item.student.email}</p>
                
                <div class="flex items-center space-x-2 mt-1">
                  {#if item.roadmap}
                    <Badge class={getStatusColor(item.roadmap.status)}>
                      {item.roadmap.status}
                    </Badge>
                    <span class="text-sm text-gray-500">
                      {item.progress}% complete
                    </span>
                  {:else}
                    <Badge class="bg-gray-100 text-gray-800">No Roadmap</Badge>
                  {/if}
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              {#if item.roadmap}
                <div class="text-right text-sm text-gray-600 mr-4">
                  <div>{item.roadmap.roadmap_data.learning_path.length} steps</div>
                  <div>{formatTime(item.roadmap.roadmap_data.total_estimated_time)}</div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-24 bg-gray-200 rounded-full h-2 mr-4">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style="width: {item.progress}%"
                  ></div>
                </div>
                
                <Button variant="outline" size="sm" on:click={() => viewStudentRoadmap(item)}>
                  <Eye class="h-4 w-4 mr-1" />
                  View
                </Button>
              {:else}
                <Button 
                  size="sm" 
                  on:click={() => generateRoadmapForStudent(item.student.id)}
                >
                  Generate Roadmap
                </Button>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Student Roadmap Details Modal -->
<Modal bind:open={showStudentModal} title="Student Roadmap Details" size="lg">
  {#if selectedStudent?.roadmap}
    <div class="space-y-6">
      <!-- Student Info -->
      <div class="flex items-center space-x-4 pb-4 border-b">
        <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <span class="text-xl font-medium text-gray-600">
            {selectedStudent.student.first_name?.[0] || selectedStudent.student.email[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900">
            {selectedStudent.student.first_name} {selectedStudent.student.last_name}
          </h3>
          <p class="text-gray-600">{selectedStudent.student.email}</p>
          <div class="flex items-center space-x-2 mt-1">
            <Badge class={getStatusColor(selectedStudent.roadmap.status)}>
              {selectedStudent.roadmap.status}
            </Badge>
            <span class="text-sm text-gray-500">
              {selectedStudent.progress}% complete
            </span>
          </div>
        </div>
      </div>

      <!-- Roadmap Overview -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {selectedStudent.roadmap.roadmap_data.learning_path.length}
          </div>
          <div class="text-sm text-gray-600">Total Steps</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {formatTime(selectedStudent.roadmap.roadmap_data.total_estimated_time)}
          </div>
          <div class="text-sm text-gray-600">Est. Time</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">
            {selectedStudent.roadmap.roadmap_data.learning_path.filter(
              item => item.completion_status === 'completed'
            ).length}
          </div>
          <div class="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      <!-- AI Reasoning -->
      <div>
        <h4 class="font-medium text-gray-900 mb-2">Personalization Reasoning</h4>
        <p class="text-sm text-gray-700 bg-gray-50 rounded p-3">
          {selectedStudent.roadmap.roadmap_data.personalization_reasoning}
        </p>
      </div>

      <!-- Learning Path Preview -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">Learning Path</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each selectedStudent.roadmap.roadmap_data.learning_path as item, index}
            <div class="flex items-center space-x-3 p-2 rounded border">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          {item.completion_status === 'completed' ? 'bg-green-100 text-green-800' :
                           item.completion_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                           item.completion_status === 'failed' ? 'bg-red-100 text-red-800' :
                           'bg-gray-100 text-gray-800'}">
                {index + 1}
              </div>
              <div class="flex-1">
                <div class="font-medium text-sm">{item.title}</div>
                <div class="text-xs text-gray-500">
                  {item.content_type} • {formatTime(item.estimated_time)}
                </div>
              </div>
              <Badge class="text-xs {item.completion_status === 'completed' ? 'bg-green-100 text-green-800' :
                                    item.completion_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    item.completion_status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}">
                {item.completion_status.replace('_', ' ')}
              </Badge>
            </div>
          {/each}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" on:click={() => showStudentModal = false}>
          Close
        </Button>
        <Button on:click={() => generateRoadmapForStudent(selectedStudent.student.id)}>
          Regenerate Roadmap
        </Button>
      </div>
    </div>
  {/if}
</Modal>