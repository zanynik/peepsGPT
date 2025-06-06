import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { 
  MapPin, 
  Calendar, 
  MessageCircle, 
  User, 
  Heart,
  MoreVertical 
} from "lucide-react";
import { motion } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  location: string;
  photoUrl: string;
  publicDescription?: string;
  matchPercentage?: number;
}

interface EnhancedUserCardProps {
  user: User;
  onViewProfile: (user: User) => void;
  onMessage?: (user: User) => void;
  onLike?: (user: User) => void;
  isLiked?: boolean;
}

export function EnhancedUserCard({ 
  user, 
  onViewProfile, 
  onMessage, 
  onLike,
  isLiked = false 
}: EnhancedUserCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          {/* Cover/Background */}
          <div className="h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
          
          {/* Profile Image */}
          <div className="absolute -bottom-12 left-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <img 
                src={user.photoUrl} 
                alt={user.name}
                className="object-cover w-full h-full"
              />
            </Avatar>
          </div>

          {/* Match Percentage Badge */}
          {user.matchPercentage && (
            <div className="absolute top-4 right-4">
              <Badge 
                variant={user.matchPercentage > 80 ? "default" : "secondary"}
                className="text-xs font-semibold px-2 py-1"
              >
                {user.matchPercentage}% Match
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 left-4">
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm">
              <MoreVertical className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        <CardContent className="pt-16 pb-6">
          <div className="space-y-4">
            {/* Name and Basic Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mt-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{user.age} years</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {user.publicDescription && (
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                {user.publicDescription}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button 
                onClick={() => onViewProfile(user)}
                variant="outline" 
                className="flex-1"
                size="sm"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
              
              {onMessage && (
                <Button 
                  onClick={() => onMessage(user)}
                  className="flex-1"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}

              {onLike && (
                <Button 
                  onClick={() => onLike(user)}
                  variant={isLiked ? "default" : "outline"}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}