import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  User, 
  Calendar, 
  Tag as TagIcon, 
  CheckCircle2, 
  Circle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Tag, Feature } from '../types';
import { Button } from './ui/button';

export interface FilterOptions {
  keyword: string;
  members: string[];
  features: string[];
  tags: string[];
  cardStatus: ('completed' | 'incomplete')[];
  dueDate: ('no-date' | 'overdue' | 'next-day' | 'next-week' | 'next-month')[];
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterOptions) => void;
  availableMembers: string[];
  availableTags: Tag[];
  availableFeatures: Feature[];
  currentFilters: FilterOptions;
}

export function FilterModal({
  open,
  onClose,
  onApplyFilter,
  availableMembers,
  availableTags,
  availableFeatures,
  currentFilters,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      setFilters(currentFilters);
    }
  }, [open, currentFilters]);

  const handleToggleMember = (member: string, isCurrentUser: boolean = false) => {
    setFilters((prev) => {
      const currentMembers = prev.members || [];
      const exists = currentMembers.includes(member);
      return {
        ...prev,
        members: exists
          ? currentMembers.filter((m) => m !== member)
          : [...currentMembers, member],
      };
    });
  };

  const handleToggleFeature = (featureId: string) => {
    setFilters((prev) => {
      const currentFeatures = prev.features || [];
      const exists = currentFeatures.includes(featureId);
      return {
        ...prev,
        features: exists
          ? currentFeatures.filter((f) => f !== featureId)
          : [...currentFeatures, featureId],
      };
    });
  };

  const handleToggleTag = (tagId: string) => {
    setFilters((prev) => {
      const currentTags = prev.tags || [];
      const exists = currentTags.includes(tagId);
      return {
        ...prev,
        tags: exists
          ? currentTags.filter((t) => t !== tagId)
          : [...currentTags, tagId],
      };
    });
  };

  const handleToggleCardStatus = (status: 'completed' | 'incomplete') => {
    setFilters((prev) => {
      const currentStatus = prev.cardStatus || [];
      const exists = currentStatus.includes(status);
      return {
        ...prev,
        cardStatus: exists
          ? currentStatus.filter((s) => s !== status)
          : [...currentStatus, status],
      };
    });
  };

  const handleToggleDueDate = (
    date: 'no-date' | 'overdue' | 'next-day' | 'next-week' | 'next-month'
  ) => {
    setFilters((prev) => {
      const currentDates = prev.dueDate || [];
      const exists = currentDates.includes(date);
      return {
        ...prev,
        dueDate: exists
          ? currentDates.filter((d) => d !== date)
          : [...currentDates, date],
      };
    });
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: FilterOptions = {
      keyword: '',
      members: [],
      features: [],
      tags: [],
      cardStatus: [],
      dueDate: [],
    };
    setFilters(emptyFilters);
    onApplyFilter(emptyFilters);
  };

  const isFilterActive = () => {
    return (
      filters.keyword !== '' ||
      filters.members.length > 0 ||
      filters.features.length > 0 ||
      filters.tags.length > 0 ||
      filters.cardStatus.length > 0 ||
      filters.dueDate.length > 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Filter</DialogTitle>
          <DialogDescription className="sr-only">
            카드를 필터링합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyword */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Keyword</Label>
            <Input
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Enter a keyword..."
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400">
              Search cards, members, labels, and more.
            </p>
          </div>

          {/* Members */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Members</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="no-members"
                  checked={filters.members.includes('__no_members__')}
                  onCheckedChange={() => handleToggleMember('__no_members__')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="no-members"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">No members</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="assigned-to-me"
                  checked={filters.members.includes('__current_user__')}
                  onCheckedChange={() => handleToggleMember('__current_user__', true)}
                  className="border-gray-500"
                />
                <label
                  htmlFor="assigned-to-me"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white">
                    나
                  </div>
                  <span className="text-sm">Cards assigned to me</span>
                </label>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <button
                  onClick={() => setShowMembersDropdown(!showMembersDropdown)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-700 text-sm"
                >
                  <span className="text-gray-300">Select members</span>
                  {showMembersDropdown ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {showMembersDropdown && (
                  <div className="mt-1 space-y-1 pl-2">
                    {availableMembers.map((member) => (
                      <div
                        key={member}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                      >
                        <Checkbox
                          id={`member-${member}`}
                          checked={filters.members.includes(member)}
                          onCheckedChange={() => handleToggleMember(member)}
                          className="border-gray-500"
                        />
                        <label
                          htmlFor={`member-${member}`}
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                            {member.charAt(0)}
                          </div>
                          <span className="text-sm">{member}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Features</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="no-feature"
                  checked={filters.features.includes('__no_feature__')}
                  onCheckedChange={() => handleToggleFeature('__no_feature__')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="no-feature"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">No feature</span>
                </label>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <button
                  onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-700 text-sm"
                >
                  <span className="text-gray-300">Select features</span>
                  {showFeaturesDropdown ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {showFeaturesDropdown && (
                  <div className="mt-1 space-y-1 pl-2 max-h-48 overflow-y-auto">
                    {availableFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                      >
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={filters.features.includes(feature.id)}
                          onCheckedChange={() => handleToggleFeature(feature.id)}
                          className="border-gray-500"
                        />
                        <label
                          htmlFor={`feature-${feature.id}`}
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: feature.color || '#8B5CF6' }}
                          />
                          <span className="text-sm truncate">{feature.title}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card status */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Card status</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="status-completed"
                  checked={filters.cardStatus.includes('completed')}
                  onCheckedChange={() => handleToggleCardStatus('completed')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="status-completed"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Marked as complete</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="status-incomplete"
                  checked={filters.cardStatus.includes('incomplete')}
                  onCheckedChange={() => handleToggleCardStatus('incomplete')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="status-incomplete"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Not marked as complete</span>
                </label>
              </div>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Due date</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="due-no-date"
                  checked={filters.dueDate.includes('no-date')}
                  onCheckedChange={() => handleToggleDueDate('no-date')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="due-no-date"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">No dates</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="due-overdue"
                  checked={filters.dueDate.includes('overdue')}
                  onCheckedChange={() => handleToggleDueDate('overdue')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="due-overdue"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Overdue</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="due-next-day"
                  checked={filters.dueDate.includes('next-day')}
                  onCheckedChange={() => handleToggleDueDate('next-day')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="due-next-day"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Due in the next day</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="due-next-week"
                  checked={filters.dueDate.includes('next-week')}
                  onCheckedChange={() => handleToggleDueDate('next-week')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="due-next-week"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Due in the next week</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="due-next-month"
                  checked={filters.dueDate.includes('next-month')}
                  onCheckedChange={() => handleToggleDueDate('next-month')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="due-next-month"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Due in the next month</span>
                </label>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Labels</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Checkbox
                  id="no-labels"
                  checked={filters.tags.includes('__no_labels__')}
                  onCheckedChange={() => handleToggleTag('__no_labels__')}
                  className="border-gray-500"
                />
                <label
                  htmlFor="no-labels"
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <TagIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">No labels</span>
                </label>
              </div>

              {availableTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                >
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={filters.tags.includes(tag.id)}
                    onCheckedChange={() => handleToggleTag(tag.id)}
                    className="border-gray-500"
                  />
                  <label
                    htmlFor={`tag-${tag.id}`}
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <div
                      className="h-8 flex-1 rounded px-3 flex items-center"
                      style={{ backgroundColor: tag.color }}
                    >
                      <span className="text-sm text-white font-medium">{tag.name}</span>
                    </div>
                  </label>
                </div>
              ))}

              {availableTags.length > 3 && (
                <div className="border-t border-gray-700 pt-2">
                  <button
                    onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                    className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-700 text-sm"
                  >
                    <span className="text-gray-300">Select labels</span>
                    {showLabelsDropdown ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!isFilterActive()}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Clear all
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
