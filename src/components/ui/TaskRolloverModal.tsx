import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, X, Calendar } from 'lucide-react';
import type { Task } from '../../types';
import { formatDateToString } from '../../utils/taskRollover';

interface TaskRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  incompleteTasks: Task[];
  fromDate: Date;
  toDate: Date;
}

export const TaskRolloverModal: React.FC<TaskRolloverModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  incompleteTasks,
  fromDate,
  toDate
}) => {
  if (!isOpen || incompleteTasks.length === 0) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-[9999]">
      <div className="bg-[#131313] rounded-xl shadow-2xl w-full max-w-md mx-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">未完了タスクの繰り越し</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1e1e1e] rounded-lg transition-colors text-[#888] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-[#ccc] mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {formatDateToString(fromDate)} から {formatDateToString(toDate)} への繰り越し
              </span>
            </div>
            <p className="text-[#888] text-sm">
              以下の未完了タスクが見つかりました。今日のタスクリストに追加しますか？
            </p>
          </div>

          {/* 未完了タスクリスト */}
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {incompleteTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2e2e2e]"
              >
                <div className={`
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${task.priority === 'S' ? 'bg-red-400' :
                    task.priority === 'A' ? 'bg-orange-400' : 'bg-green-400'}
                `} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-[#888] mt-1">
                    <span className={`
                      px-2 py-1 rounded-full text-xs
                      ${task.priority === 'S' ? 'bg-red-500/20 text-red-300' :
                        task.priority === 'A' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-green-500/20 text-green-300'}
                    `}>
                      {task.priority}優先
                    </span>
                    <span>{task.estimatedHours}時間</span>
                    {task.isRecurring && (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                        繰り返し
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2 border border-[#333] rounded-lg text-[#ccc] hover:bg-[#1e1e1e] transition-colors text-sm"
            >
              今回はスキップ
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>繰り越す ({incompleteTasks.length}件)</span>
            </button>
          </div>

          {/* 説明 */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 繰り越されたタスクは今日の予定に追加され、元の日付は記録として保持されます。
              繰り返しタスクの場合は新しいインスタンスが作成されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};