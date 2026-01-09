"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

interface UserNavProps {
  user: Session["user"];
}

export function UserNav({ user }: UserNavProps) {
  if (!user) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center items-center gap-x-3 rounded-full bg-zinc-800 border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UserIcon size={14} />
          </div>
          <span className="hidden sm:inline">{user.name}</span>
          <ChevronDown
            className="-mr-1 h-4 w-4 text-zinc-400"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-white/5 rounded-xl bg-[#18181b] border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={`${
                    active ? "bg-white/5 text-white" : "text-zinc-400"
                  } group flex w-full items-center px-4 py-2 text-sm transition-colors`}
                >
                  <LogOut
                    className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-zinc-300"
                    aria-hidden="true"
                  />
                  Cerrar Sesión
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
