"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import NavItems from "./NavItems";
import { signOut } from "@/lib/actions/auth-actions";

const UserDropdown = ({
  name,
  email,
  initialStocks,
}: User & {
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          className="flex items-center gap-3 text-gray-400 hover:text-yellow-500"
        >
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
              {name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">{name}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-gray-400">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {name}
              </span>
              <span className="text-sm text-gray-500">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-gray-100 text-shadow-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hidden sm:block bg-gray-600" />
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks} />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
