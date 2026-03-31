"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, CheckCircle2, User, ChevronDown, Filter } from "lucide-react";

interface Voter {
    id: string;
    name: string;
    house_name: string;
    present_address: string;
    national_id: string;
    registered_box: string;
    vote_status: boolean;
    voted_at: string | null;
}

interface GroupedVoters {
    group1: Voter[];
    group2: Voter[];
    group3: Voter[];
    group4: Voter[];
}

export default function ObserverVoterFilter({ groupedVoters }: { groupedVoters: GroupedVoters }) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<"pending" | "voted">("pending");
    const [selectedGroup, setSelectedGroup] = useState<string>("all");

    const groupLabels = {
        group1: "70 | Sh. Milandhoo-1",
        group2: "71 | Sh. Milandhoo-2",
        group3: "Male' Area",
        group4: "Other Boxes"
    };

    const getFilteredList = (voters: Voter[]) => {
        const q = search.toLowerCase().trim();
        return voters.filter(v => {
            const matchesSearch = !q ||
                v.name?.toLowerCase().includes(q) ||
                v.national_id?.includes(q) ||
                v.house_name?.toLowerCase().includes(q);
            const matchesStatus = filterType === "voted" ? v.vote_status : !v.vote_status;
            return matchesSearch && matchesStatus;
        });
    };

    const filteredData = useMemo(() => ({
        group1: getFilteredList(groupedVoters.group1),
        group2: getFilteredList(groupedVoters.group2),
        group3: getFilteredList(groupedVoters.group3),
        group4: getFilteredList(groupedVoters.group4)
    }), [groupedVoters, search, filterType]);

    const totalCount = useMemo(() => {
        return filteredData.group1.length + filteredData.group2.length + filteredData.group3.length + filteredData.group4.length;
    }, [filteredData]);

    return (
        <div className="space-y-8 pb-12">
            {/* Header & Controls */}
            <div className="flex flex-col gap-6 sticky top-14 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <div className="relative flex-1 md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="search"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-11 h-12 rounded-2xl border-slate-200 focus:ring-primary shadow-sm"
                            />
                        </div>

                        <div className="relative flex-1 md:max-w-xs">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={selectedGroup}
                                onChange={e => setSelectedGroup(e.target.value)}
                                className="w-full h-12 pl-11 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary appearance-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                <option value="all">All Groups</option>
                                <option value="group1">70 | Sh. Milandhoo-1</option>
                                <option value="group2">71 | Sh. Milandhoo-2</option>
                                <option value="group3">Male' Area</option>
                                <option value="group4">Other Boxes</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-2xl w-full xl:w-auto h-12 ring-1 ring-slate-200/50 shrink-0">
                        <button
                            onClick={() => setFilterType("pending")}
                            className={`flex-1 xl:flex-none px-8 h-full text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filterType === "pending" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilterType("voted")}
                            className={`flex-1 xl:flex-none px-8 h-full text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filterType === "voted" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            Marked Voted
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center text-primary/50 gap-2 px-1">
                    {totalCount} {filterType === "voted" ? "Voted" : "Pending"}
                </div>
            </div>

            {/* Grouped Content */}
            <div className="grid grid-cols-1 gap-12">
                {Object.entries(filteredData).map(([key, voters]) => {
                    if (selectedGroup !== "all" && selectedGroup !== key) return null;
                    if (voters.length === 0 && !search) return null; // Show even if empty when searching

                    return (
                        <div key={key} className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-4">
                                    <div className="h-6 w-1.5 bg-primary rounded-full" />
                                    <h2 className="text-lg font-semibold text-slate-700 uppercase tracking-tight">
                                        {groupLabels[key as keyof typeof groupLabels]}
                                    </h2>
                                </div>
                                <Badge variant="secondary" className="font-bold bg-slate-100">
                                    {voters.length}
                                </Badge>
                            </div>

                            {voters.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {voters.map(voter => (
                                        <Card key={voter.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="space-y-1.5 min-w-0">
                                                        <p className="font-semibold text-[16px] text-slate-800 group-hover:text-primary transition-colors truncate">
                                                            {voter.name}
                                                        </p>
                                                        {(voter.house_name || voter.present_address) && (
                                                            <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
                                                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                                                                <span className="truncate">{voter.house_name || voter.present_address}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {filterType === "voted" ? (
                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <div className="p-2 bg-green-500/10 rounded-xl text-green-600">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 bg-slate-100 rounded-xl text-slate-300 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className=" pt-2 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
                                                        {voter.registered_box}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                                    <p className="text-slate-400 font-medium italic">No voters found in this category.</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {totalCount === 0 && (
                <div className="text-center py-24">
                    <div className="inline-flex p-6 bg-slate-100 rounded-full mb-6">
                        <Search className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">No matches found</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        We couldn't find any voters matching your search or filters in any of the box groups.
                    </p>
                </div>
            )}
        </div>
    );
}
