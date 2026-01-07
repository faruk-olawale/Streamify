import { Users, Crown, ChevronRight } from "lucide-react";
import { Link } from "react-router";

const GroupCard = ({ group, isMember }) => {
  return (
    <Link
      to={`/groups/${group._id}`}
      className="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
    >
      <div className="card-body">
        <div className="flex items-start gap-3">
          <div className="avatar">
            <div className="w-16 h-16 rounded-lg">
              <img
                src={group.image || "https://via.placeholder.com/150?text=Group"}
                alt={group.name}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{group.name}</h3>
            <p className="text-sm text-base-content/60 line-clamp-2">
              {group.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-base-content/70 mt-3">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{group.members?.length || 0} members</span>
          </div>
          {group.createdBy && (
            <div className="flex items-center gap-1">
              <Crown size={16} />
              <span className="truncate">{group.createdBy.name}</span>
            </div>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-4 pt-4 border-t border-base-300">
          {isMember ? (
            <span className="badge badge-success">Member</span>
          ) : (
            <span className="badge badge-ghost">Not a member</span>
          )}
          <ChevronRight size={20} className="text-base-content/50" />
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;