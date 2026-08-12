import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, ListTodo, Plus, Trash2, Calendar as CalIcon, LayoutGrid, List } from 'lucide-react';
import { useSchedule, ScheduleEvent, TodoStatus } from '../shared/ScheduleContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TodoApp.css';

interface TodoAppProps {
  onBack: () => void;
}

const KANBAN_COLUMNS: { id: TodoStatus; title: string }[] = [
  { id: 'todo', title: '할일' },
  { id: 'in_progress', title: '진행 중' },
  { id: 'done', title: '완료' },
];

function KanbanCard({ item, removeEvent }: { item: ScheduleEvent, removeEvent: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <h4>{item.what}</h4>
        <button className="icon-btn delete-icon-btn" onClick={(e) => { e.stopPropagation(); removeEvent(item.id); }}>
          <Trash2 size={14} />
        </button>
      </div>
      {!item.isTodo && <span className="source-badge"><CalIcon size={10} /> 일정</span>}
    </div>
  );
}

function KanbanColumnArea({ id, items, removeEvent }: { id: string, items: ScheduleEvent[], removeEvent: (id: string) => void }) {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div ref={setNodeRef} className="kanban-droppable-area" id={id}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <KanbanCard key={item.id} item={item} removeEvent={removeEvent} />
        ))}
      </SortableContext>
      {items.length === 0 && (
        <div className="kanban-empty">비어있음</div>
      )}
    </div>
  );
}

export function TodoApp({ onBack }: TodoAppProps) {
  const { events, addEvent, removeEvent, toggleEventCompletion, updateEventStatus } = useSchedule();
  const [inputText, setInputText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Swipe logic for list view
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    const touchCurrentX = e.touches[0].clientX;
    if (touchStartX.current - touchCurrentX > 50) { // Swipe left
      setSwipedItemId(id);
    } else if (touchCurrentX - touchStartX.current > 50) { // Swipe right
      setSwipedItemId(null);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let when = new Date().toISOString();
    let what = inputText;

    if (inputText.includes('까지')) {
      const parts = inputText.split('까지');
      what = parts[1].trim() || parts[0].trim();
      
      const targetDate = new Date();
      if (parts[0].includes('내일')) {
        targetDate.setDate(targetDate.getDate() + 1);
        when = targetDate.toISOString();
      } else if (parts[0].includes('모레')) {
        targetDate.setDate(targetDate.getDate() + 2);
        when = targetDate.toISOString();
      }
    }

    addEvent({
      what,
      when,
      isTodo: true,
      completed: false,
      status: 'todo',
    });
    setInputText('');
  };

  const calculateDDay = (when: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(when);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const sortedItems = [...events].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

  // Kanban logic
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if dragging over a column directly or another item
    const isOverAColumn = KANBAN_COLUMNS.some(col => col.id === overId);
    
    if (isOverAColumn) {
      updateEventStatus(activeId, overId as TodoStatus);
    } else {
      // Dragging over another item -> inherit its status
      const overItem = events.find(e => e.id === overId);
      if (overItem) {
        updateEventStatus(activeId, overItem.status || 'todo');
      }
    }
  };

  return (
    <div className="todo-app app-container animate-fade-in">
      <div className="app-header glass-panel">
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2>할일</h2>
        <div className="header-actions">
          <button className={`icon-btn ${viewMode === 'list' ? 'active-view' : ''}`} onClick={() => setViewMode('list')}>
            <List size={20} />
          </button>
          <button className={`icon-btn ${viewMode === 'kanban' ? 'active-view' : ''}`} onClick={() => setViewMode('kanban')}>
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      <div className="app-content">
        <form className="todo-input-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="내일까지 보고서 작성"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="todo-input glass-panel"
          />
          <button type="submit" className="add-btn"><Plus size={20} /></button>
        </form>

        {viewMode === 'list' ? (
          <div className="todo-list">
            {sortedItems.map(item => (
              <div 
                key={item.id} 
                className={`todo-item-wrapper ${swipedItemId === item.id ? 'swiped' : ''}`}
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchMove={(e) => handleTouchMove(e, item.id)}
              >
                <div className={`todo-card glass-panel ${item.status === 'done' || item.completed ? 'completed' : ''}`}>
                  <div className="todo-content">
                    <div className="todo-checkbox" onClick={() => toggleEventCompletion(item.id)}>
                      {(item.status === 'done' || item.completed) && <div className="check-mark" />}
                    </div>
                    <div className="todo-text">
                      <h4>{item.what}</h4>
                      <span className={`d-day ${calculateDDay(item.when).startsWith('D+') ? 'overdue' : ''}`}>
                        {calculateDDay(item.when)}
                      </span>
                      {!item.isTodo && <span className="source-badge"><CalIcon size={10} /> 일정</span>}
                      {item.status === 'in_progress' && <span className="source-badge in-progress-badge">진행 중</span>}
                    </div>
                  </div>
                </div>
                <div className="delete-action" onClick={() => removeEvent(item.id)}>
                  <Trash2 size={24} color="white" />
                </div>
              </div>
            ))}

            {sortedItems.length === 0 && (
              <div className="empty-state">남은 할일이 없습니다! 🎉</div>
            )}
          </div>
        ) : (
          <div className="kanban-board">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {KANBAN_COLUMNS.map(column => {
                const columnItems = sortedItems.filter(item => (item.status || 'todo') === column.id);
                return (
                  <div key={column.id} className="kanban-column">
                    <h3 className="kanban-column-title">{column.title} <span className="count">{columnItems.length}</span></h3>
                    <KanbanColumnArea id={column.id} items={columnItems} removeEvent={removeEvent} />
                  </div>
                );
              })}
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
